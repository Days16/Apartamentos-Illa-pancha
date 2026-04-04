/**
 * Edge Function: send-push
 *
 * Envía una notificación push a una suscripción Web Push.
 * Llamada desde send-reservation-email u otras Edge Functions tras eventos clave.
 *
 * Variables de entorno necesarias:
 *   VAPID_PUBLIC_KEY   — clave pública VAPID
 *   VAPID_PRIVATE_KEY  — clave privada VAPID
 *   VAPID_EMAIL        — mailto: del propietario de las claves
 *
 * Body esperado:
 *   { subscription: PushSubscription, title: string, body: string, url?: string }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firma del payload Web Push usando VAPID (implementación manual sin librería)
async function signVapid(audience: string, subject: string, publicKey: string, privateKey: string): Promise<string> {
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const sigInput = `${header}.${payload}`;

  // Importar clave privada VAPID (formato base64url raw)
  const keyData = Uint8Array.from(atob(privateKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, new TextEncoder().encode(sigInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${sigInput}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { subscription, title, body, url } = await req.json();
    if (!subscription?.endpoint) {
      return new Response(JSON.stringify({ error: "subscription requerida" }), { status: 400, headers: corsHeaders });
    }

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:info@illapancha.com";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys no configuradas" }), { status: 500, headers: corsHeaders });
    }

    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;
    const jwt = await signVapid(audience, vapidEmail, vapidPublic, vapidPrivate);

    const payload = JSON.stringify({ title, body, url: url || "/gestion" });

    const pushRes = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Authorization": `vapid t=${jwt},k=${vapidPublic}`,
        "TTL": "86400",
      },
      body: new TextEncoder().encode(payload),
    });

    if (!pushRes.ok && pushRes.status !== 201) {
      const err = await pushRes.text();
      return new Response(JSON.stringify({ error: err }), { status: pushRes.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
