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
      Deno.env.get("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Invalid webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // ====================================
    // 1. CHECKOUT COMPLETED → ACTIVATE
    // ====================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

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

    // ====================================
    // 2. SUBSCRIPTION UPDATED (CANCELLED)
    // ====================================
    if (event.type === "customer.subscription.updated") {
      const stripeSub = event.data.object as Stripe.Subscription;

      // Stripe marks cancellations via status
      if (stripeSub.status === "canceled") {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            ends_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSub.id);
      }
    }

    // ====================================
    // 3. PAYMENT FAILED (RECURRING)
    // ====================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = invoice.subscription as string;

      if (stripeSubId) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "expired",
          })
          .eq("stripe_subscription_id", stripeSubId);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook processing error", err);
    return new Response("Webhook error", { status: 500 });
  }
});
