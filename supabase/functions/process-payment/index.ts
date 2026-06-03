import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const ALLOWED_ORIGINS = [
    "https://apartamentosillapancha.com",
    "https://www.apartamentosillapancha.com",
    "http://localhost:5173",
];

function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get("origin") ?? "";
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
    };
}

const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET_KEY") || "";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
    if (!TURNSTILE_SECRET) return true;
    if (!token?.trim()) return false;
    const form = new FormData();
    form.append("secret", TURNSTILE_SECRET);
    form.append("response", token);
    form.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: form,
    });
    const data = await res.json();
    return data.success === true;
}

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

async function isRateLimited(ip: string): Promise<boolean> {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const now = Date.now();
    const resetAt = new Date(now + RATE_WINDOW_MS).toISOString();
    const { data } = await supabase
        .from("rate_limits")
        .select("count, reset_at")
        .eq("ip", ip)
        .single();
    if (!data || now > new Date(data.reset_at).getTime()) {
        await supabase.from("rate_limits").upsert({ ip, count: 1, reset_at: resetAt });
        return false;
    }
    if (data.count >= RATE_LIMIT) return true;
    await supabase.from("rate_limits").update({ count: data.count + 1 }).eq("ip", ip);
    return false;
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (await isRateLimited(ip)) {
        return new Response(
            JSON.stringify({ error: "Demasiados intentos. Espera unos minutos." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
    }

    try {
        const { reservationId, customerName, turnstileToken } = await req.json();

        if (!reservationId || typeof reservationId !== "string") {
            return new Response(
                JSON.stringify({ error: "Reserva no válida." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const turnstileOk = await verifyTurnstile(turnstileToken || "", ip);
        if (!turnstileOk) {
            return new Response(
                JSON.stringify({
                    error: "Verificación de seguridad no válida. Completa el captcha e inténtalo de nuevo.",
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
        }

        // Obtener precio y datos de la reserva DESDE LA BASE DE DATOS
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        const { data: reservation, error: resErr } = await supabase
            .from("reservations")
            .select("deposit, total, status, email, apt_slug")
            .eq("id", reservationId)
            .single();

        if (resErr || !reservation) {
            return new Response(
                JSON.stringify({ error: "Reserva no encontrada." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
            );
        }

        if (reservation.status !== "pending") {
            return new Response(
                JSON.stringify({ error: "Esta reserva ya ha sido procesada." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
            );
        }

        // El importe siempre viene de la BD, nunca del cliente
        const amount = Math.round((reservation.deposit ?? reservation.total ?? 0) * 100);

        if (amount <= 0) {
            return new Response(
                JSON.stringify({ error: "Importe de reserva no válido." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            description: `Reserva ${reservation.apt_slug} — ${reservationId}`,
            receipt_email: reservation.email,
            metadata: { reservationId, customerName: customerName ?? "" },
        }, {
            idempotencyKey: `payment-${reservationId}`,
        });

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const requestId = crypto.randomUUID();
        console.error(`[${requestId}] Payment error:`, error);
        return new Response(
            JSON.stringify({
                error: "Error procesando el pago. Inténtalo de nuevo.",
                requestId,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
