/**
 * Edge Function: post-stay-review
 *
 * Puede ejecutarse por CRON (diario) o por invocación manual.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@apartamentosillapancha.com";
const GOOGLE_REVIEWS_URL = Deno.env.get("GOOGLE_REVIEWS_URL") || "https://search.google.com/local/writereview?placeid=ChIJ7f13TXLlEw0RpfM8aBdFYVs";
const SITE_URL = Deno.env.get("SITE_URL") || "https://apartamentosillapancha.com";

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(guestName: string, apartmentName: string, googleUrl: string, siteReviewUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Helvetica', sans-serif; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 48px 40px; border-radius: 16px; border: 1px solid #efefef;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 28px; font-weight: bold; color: #1a5f6e;">Illa Pancha</div>
      <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Apartamentos · Ribadeo</div>
    </div>

    <h1 style="font-size: 22px; color: #0f172a; font-weight: normal; margin-bottom: 16px; text-align: center;">
      Hola, <strong>${guestName}</strong> 👋
    </h1>

    <p style="color: #4b5563; line-height: 1.7; margin-bottom: 24px; text-align: center;">
      Esperamos que hayas disfrutado de tu reciente estancia en <strong>${apartmentName}</strong>. 
      Tu opinión es fundamental para nosotros y para ayudar a otros viajeros.
    </p>

    <div style="background: #fdfdfd; padding: 24px; border: 1px dashed #e2e8f0; border-radius: 12px; margin-bottom: 32px; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">¿Podrías dedicarnos un minuto?</p>
      
      <a href="${googleUrl}" target="_blank" style="display: block; background: #1a5f6e; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-bottom: 12px;">
        🌟 Reseña en Google (1 clic)
      </a>

      <a href="${siteReviewUrl}" target="_blank" style="display: block; background: #fff; color: #1a5f6e; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; border: 2px solid #1a5f6e;">
        ✍️ Opinión en nuestra web
      </a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
      Si hubo algo que no fue de tu agrado, por favor responde a este correo directamente para que podamos solucionarlo.
    </p>

    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
    
    <p style="color: #94a3b8; font-size: 11px; text-align: center;">
      Illa Pancha Ribadeo · Galicia · España
    </p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { guestEmail, guestName, apartmentName, reviewToken, manual } = await req.json();

  if (manual) {
    // Invocación manual para una reserva específica
    const siteReviewUrl = `${SITE_URL}/dejar-resena?token=${reviewToken}`;
    
    try {
      const { data, error } = await resend.emails.send({
        from: `Illa Pancha <${FROM_EMAIL}>`,
        to: [guestEmail],
        subject: `¿Cómo te fue en ${apartmentName}? 🌟`,
        html: buildEmailHtml(guestName || "estimado huésped", apartmentName, GOOGLE_REVIEWS_URL, siteReviewUrl),
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, id: data.id }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // Lógica CRON (Automática): Checkout ayer
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, guest, email, apt, review_token")
    .eq("status", "confirmed")
    .eq("checkout", yesterdayStr);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  let sent = 0;
  for (const res of (reservations || [])) {
    if (!res.email) continue;
    const siteReviewUrl = `${SITE_URL}/dejar-resena?token=${res.review_token}`;
    
    try {
      await resend.emails.send({
        from: `Illa Pancha <${FROM_EMAIL}>`,
        to: [res.email],
        subject: `¿Qué tal tu estancia en ${res.apt}? 🌟`,
        html: buildEmailHtml(res.guest, res.apt, GOOGLE_REVIEWS_URL, siteReviewUrl),
      });
      sent++;
    } catch (e) {
      console.error(`Error sending review email to ${res.email}:`, e);
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: corsHeaders });
});
