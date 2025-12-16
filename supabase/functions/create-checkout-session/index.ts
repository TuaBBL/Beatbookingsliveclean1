import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { event_id } = await req.json().catch(() => ({}));
  if (!event_id) return new Response("Missing event_id", { status: 400 });

  // IMPORTANT: identify caller via JWT (not from body)
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return new Response("Missing Authorization", { status: 401 });

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) return new Response("Invalid auth", { status: 401 });

  // Fetch event and enforce: only creator can pay-to-publish, and only drafts can be paid for
  const { data: eventRow, error: eventErr } = await supabaseAdmin
    .from("events")
    .select("id, creator_id, creator_role, status, title")
    .eq("id", event_id)
    .single();

  if (eventErr || !eventRow) return new Response("Event not found", { status: 404 });

  if (eventRow.creator_id !== userData.user.id) {
    return new Response("Not event creator", { status: 403 });
  }
  if (eventRow.status !== "draft") {
    return new Response("Event not in draft", { status: 400 });
  }

  // Price: $30 one-time publish fee (AUD cents)
  const unitAmount = 3000;
  const currency = "aud";

  const appUrl = Deno.env.get("APP_URL")!;
  const successUrl = `${appUrl}/publish/success?event_id=${event_id}`;
  const cancelUrl = `${appUrl}/publish/cancel?event_id=${event_id}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: "Event Publish Fee" },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      event_id,
      creator_id: eventRow.creator_id,
      creator_role: eventRow.creator_role,
    },
  });

  // Log it (idempotency + audit)
  await supabaseAdmin.from("event_payments").insert({
    event_id,
    creator_id: eventRow.creator_id,
    stripe_session_id: session.id,
    status: "pending",
    amount: (unitAmount / 100).toFixed(2),
    currency,
  });

  return new Response(JSON.stringify({ checkout_url: session.url }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
