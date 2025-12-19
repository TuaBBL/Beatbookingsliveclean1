import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Stripe requires raw body
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // ================================
    // CHECKOUT COMPLETED → ACTIVATE
    // ================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only handle subscription checkouts
      if (session.mode !== "subscription") {
        return new Response("Ignored non-subscription checkout", { status: 200 });
      }

      const subscriptionId = session.metadata?.subscription_id;
      if (!subscriptionId) {
        throw new Error("Missing subscription_id in metadata");
      }

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          started_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);
    }

    // ================================
    // SUBSCRIPTION CANCELLED
    // ================================
    if (event.type === "customer.subscription.deleted") {
      const stripeSub = event.data.object as Stripe.Subscription;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "cancelled",
          ends_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSub.id);
    }

    // ================================
    // PAYMENT FAILED (OPTIONAL BUT SMART)
    // ================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = invoice.subscription as string;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "expired",
        })
        .eq("stripe_subscription_id", stripeSubId);
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});
