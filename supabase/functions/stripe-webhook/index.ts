import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const EVENT_PRICE_ID = "price_1Siu225AXscM5QrivCsmef9v";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    console.error("❌ Invalid Stripe signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // ─────────────────────────────────────────────
    // CHECKOUT COMPLETED (EVENT PAYMENT)
    // ─────────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only allow one-off payments
      if (session.mode !== "payment") {
        return new Response("Not an event payment", { status: 200 });
      }

      const eventId = session.metadata?.event_id;
      const creatorId = session.metadata?.creator_id;

      if (!eventId || !creatorId) {
        console.error("❌ Missing metadata on session", session.id);
        return new Response("Missing metadata", { status: 400 });
      }

      // Fetch line items to validate price
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      if (priceId !== EVENT_PRICE_ID) {
        console.error("❌ Invalid price used", priceId);
        return new Response("Invalid price", { status: 400 });
      }

      // Idempotency check
      const { data: existing } = await supabase
        .from("event_payments")
        .select("id,status")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existing?.status === "paid") {
        return new Response("Already processed", { status: 200 });
      }

      // Upsert payment record
      await supabase
        .from("event_payments")
        .upsert(
          {
            stripe_session_id: session.id,
            event_id: eventId,
            creator_id: creatorId,
            status: "paid",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          },
          { onConflict: "stripe_session_id" },
        );

      // Publish event
      await supabase
        .from("events")
        .update({ status: "published" })
        .eq("id", eventId)
        .eq("creator_id", creatorId);

      return new Response("OK", { status: 200 });
    }

    // ─────────────────────────────────────────────
    // PAYMENT FAILED
    // ─────────────────────────────────────────────
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;

      await supabase
        .from("event_payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id);

      return new Response("OK", { status: 200 });
    }

    // Ignore all other events
    return new Response("Ignored", { status: 200 });

  } catch (err) {
    console.error("🔥 Webhook handler error", err);
    return new Response("Webhook error", { status: 500 });
  }
});
