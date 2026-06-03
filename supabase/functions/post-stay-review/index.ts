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

import { getCorsHeaders } from "../_shared/cors.ts";

interface DiscountInfo {
  code: string;
  percent: number;
  validUntil: string; // dd/mm/yyyy ya formateado
}

function buildDiscountBlock(discount: DiscountInfo, siteUrl: string): string {
  return `
    <div style="background: linear-gradient(135deg, #1a5f6e 0%, #2a7f8e 100%); padding: 28px 24px; border-radius: 12px; margin-bottom: 32px; text-align: center; color: #fff;">
      <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px; color: #D4A843;">Gracias por tu visita</p>
      <p style="font-size: 18px; margin: 0 0 16px; font-weight: 300;">Tu próxima estancia con</p>
      <div style="font-size: 42px; font-weight: bold; color: #D4A843; margin-bottom: 8px;">-${discount.percent}%</div>
      <div style="background: rgba(255,255,255,0.12); border: 1px dashed rgba(255,255,255,0.4); padding: 14px 20px; border-radius: 8px; margin: 16px 0; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
        ${discount.code}
      </div>
      <p style="font-size: 13px; margin: 0 0 16px; color: rgba(255,255,255,0.8);">
        Válido hasta el <strong>${discount.validUntil}</strong> · Aplica el código al reservar
      </p>
      <a href="${siteUrl}/apartamentos" target="_blank" style="display: inline-block; background: #D4A843; color: #0f172a; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Reservar de nuevo →
      </a>
    </div>
  `;
}

function buildEmailHtml(
  guestName: string,
  apartmentName: string,
  googleUrl: string,
  siteReviewUrl: string,
  discount?: DiscountInfo,
  siteUrl: string = "https://apartamentosillapancha.com"
): string {
  const discountBlock = discount ? buildDiscountBlock(discount, siteUrl) : "";
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

    ${discountBlock}

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
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { guestEmail, guestName, apartmentName, reviewToken, reservationId, manual, discount } = await req.json();

  let token = reviewToken;
  const invalidToken = token === '00000000-0000-0000-0000-000000000000' || token === 'null' || token === 'undefined';
  if (!token || invalidToken) {
    token = crypto.randomUUID();
    if (manual && reservationId) {
      await supabase.from('reservations').update({ review_token: token }).eq('id', reservationId);
    }
  }

  if (manual) {
    // Invocación manual para una reserva específica
    const siteReviewUrl = `${SITE_URL}/dejar-resena?token=${token}`;

    try {
      const { data, error } = await resend.emails.send({
        from: `Illa Pancha <${FROM_EMAIL}>`,
        to: [guestEmail],
        subject: discount
          ? `Gracias por tu estancia en ${apartmentName} · -${discount.percent}% en tu próxima reserva 🎁`
          : `¿Cómo te fue en ${apartmentName}? 🌟`,
        html: buildEmailHtml(guestName || "estimado huésped", apartmentName, GOOGLE_REVIEWS_URL, siteReviewUrl, discount, SITE_URL),
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
    let reviewToken = res.review_token;
    if (!reviewToken) {
      reviewToken = crypto.randomUUID();
      await supabase.from('reservations').update({ review_token: reviewToken }).eq('id', res.id);
    }
    const siteReviewUrl = `${SITE_URL}/dejar-resena?token=${reviewToken}`;
    
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
