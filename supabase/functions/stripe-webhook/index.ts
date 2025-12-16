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

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (e) {
    console.error("Invalid signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const eventId = session.metadata?.event_id;
      const creatorId = session.metadata?.creator_id;

      if (!eventId || !creatorId) {
        console.error("Missing metadata", session.id);
        return new Response("Missing metadata", { status: 400 });
      }

      // Idempotency: if we already processed this session, stop
      const { data: existing } = await supabaseAdmin
        .from("event_payments")
        .select("id,status")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existing?.status === "paid") {
        return new Response("OK", { status: 200 });
      }

      // Mark payment paid
      await supabaseAdmin
        .from("event_payments")
        .update({
          status: "paid",
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("stripe_session_id", session.id);

      // Publish the event (service role bypasses RLS)
      await supabaseAdmin
        .from("events")
        .update({ status: "published" })
        .eq("id", eventId)
        .eq("creator_id", creatorId);

      return new Response("OK", { status: 200 });
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log("Payment failed:", pi.id);
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response("Webhook handler error", { status: 500 });
  }
});
