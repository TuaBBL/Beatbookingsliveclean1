import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id;
        const eventId = session.metadata?.event_id;
        const purpose = session.metadata?.purpose;

        console.log("Checkout completed", {
          sessionId: session.id,
          userId,
          eventId,
          purpose,
        });

        if (purpose === "event_publish" && eventId) {
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("id, creator_id, status")
            .eq("id", eventId)
            .maybeSingle();

          if (eventError) {
            console.error("Failed to fetch event:", eventError);
            break;
          }

          if (!eventData) {
            console.error("Event not found:", eventId);
            break;
          }

          if (eventData.creator_id !== userId) {
            console.error("User ID mismatch:", { eventCreator: eventData.creator_id, sessionUser: userId });
            break;
          }

          if (eventData.status === "published") {
            console.log("Event already published:", eventId);
            break;
          }

          const { error: updateError } = await supabase
            .from("events")
            .update({ status: "published" })
            .eq("id", eventId);

          if (updateError) {
            console.error("Failed to publish event:", updateError);
          } else {
            console.log("Event published successfully:", eventId);
          }
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription event:", event.type, subscription.id);

        // TODO:
        // Sync subscription status to DB

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
