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
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET")!,
    );
  } catch (e) {
    console.error("Invalid signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // =====================================
    // SUBSCRIPTION CREATED / PAID
    // =====================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Ignore non-subscription checkouts
      if (session.mode !== "subscription") {
        return new Response("OK", { status: 200 });
      }

      const subscriptionId = session.metadata?.subscription_id;
      if (!subscriptionId) {
        console.error("Missing subscription_id metadata", session.id);
        return new Response("Missing metadata", { status: 400 });
      }

      // Activate subscription
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          started_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      return new Response("OK", { status: 200 });
    }

    // =====================================
    // SUBSCRIPTION UPDATED (CANCELLED)
    // =====================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;

      if (sub.status === "canceled") {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            ends_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
      }

      return new Response("OK", { status: 200 });
    }

    // =====================================
    // RECURRING PAYMENT FAILED
    // =====================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = invoice.subscription as string | null;

      if (stripeSubId) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "expired",
          })
          .eq("stripe_subscription_id", stripeSubId);
      }

      return new Response("OK", { status: 200 });
    }

    // Ignore everything else
    return new Response("OK", { status: 200 });

  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response("Webhook handler error", { status: 500 });
  }
});
