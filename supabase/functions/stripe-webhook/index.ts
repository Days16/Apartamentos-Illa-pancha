import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const reservationId = paymentIntent.metadata?.reservationId;

            if (!reservationId) {
                console.warn("payment_intent.succeeded sin reservationId en metadata", paymentIntent.id);
                return new Response(JSON.stringify({ received: true }), { status: 200 });
            }

            const { error } = await supabase
                .from("reservations")
                .update({
                    status: "confirmed",
                    payment_confirmed_at: new Date().toISOString(),
                    stripe_payment_intent_id: paymentIntent.id,
                })
                .eq("id", reservationId)
                .eq("status", "pending");

            if (error) {
                console.error(`Error actualizando reserva ${reservationId}:`, error);
            } else {
                console.log(`Reserva ${reservationId} confirmada via webhook Stripe`);
            }
        }

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const reservationId = paymentIntent.metadata?.reservationId;
            if (reservationId) {
                console.warn(`Pago fallido para reserva ${reservationId}:`, paymentIntent.last_payment_error?.message);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
        console.error("Error procesando evento Stripe:", err);
        return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
    }
});
