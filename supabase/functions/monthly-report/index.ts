/**
 * Edge Function: monthly-report
 *
 * Envía el día 1 de cada mes un resumen al propietario con:
 * - Total de reservas del mes anterior
 * - Ingresos totales y por fuente
 * - Ocupación media estimada
 *
 * Activar el cron en Supabase Dashboard → Edge Functions → Schedules:
 *   Cron expression: 0 8 1 * *   (día 1 de cada mes a las 8:00 UTC)
 *   Function: monthly-report
 *
 * O vía SQL con pg_cron:
 *   select cron.schedule('monthly-report', '0 8 1 * *',
 *     $$select net.http_post(url := 'https://<project>.supabase.co/functions/v1/monthly-report',
 *       headers := '{"Authorization":"Bearer <anon_key>"}') as request_id$$);
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") || "";

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Rango del mes anterior
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fromISO = firstOfLastMonth.toISOString().split("T")[0];
  const toISO = firstOfThisMonth.toISOString().split("T")[0];

  const monthName = firstOfLastMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  // Reservas del mes anterior (no canceladas)
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("*")
    .neq("status", "cancelled")
    .gte("checkin", fromISO)
    .lt("checkin", toISO);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const total = reservations?.length ?? 0;
  const income = reservations?.reduce((sum, r) => sum + (r.total_price ?? r.total ?? 0), 0) ?? 0;
  const deposit = reservations?.reduce((sum, r) => sum + (r.deposit_paid ?? r.deposit ?? 0), 0) ?? 0;

  // Ingresos por fuente
  const bySource: Record<string, number> = {};
  reservations?.forEach(r => {
    const src = r.source || "web";
    bySource[src] = (bySource[src] || 0) + 1;
  });

  const sourceRows = Object.entries(bySource)
    .map(([src, count]) => `<tr><td style="padding:4px 12px">${src}</td><td style="padding:4px 12px;text-align:right">${count}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2 style="color:#1a5f6e">📊 Informe mensual — ${monthName}</h2>
      <p>Resumen de actividad del mes pasado en <strong>Illa Pancha Apartamentos</strong>.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;background:#f8fafc;border-radius:8px">
        <tr><td style="padding:8px 12px;font-weight:600">Reservas</td><td style="padding:8px 12px;text-align:right">${total}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600">Ingresos totales</td><td style="padding:8px 12px;text-align:right">${income.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600">Pagos recibidos (señal)</td><td style="padding:8px 12px;text-align:right">${deposit.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td></tr>
      </table>
      ${total > 0 ? `
      <h3>Reservas por fuente</h3>
      <table style="border-collapse:collapse;width:100%;background:#f8fafc;border-radius:8px">
        <tr style="border-bottom:1px solid #e2e8f0"><th style="padding:6px 12px;text-align:left">Fuente</th><th style="padding:6px 12px;text-align:right">Reservas</th></tr>
        ${sourceRows}
      </table>` : "<p style='color:#64748b'>No hubo reservas este mes.</p>"}
      <p style="margin-top:32px;font-size:12px;color:#94a3b8">
        Enviado automáticamente el día 1 de ${now.toLocaleDateString("es-ES", { month: "long" })} de ${now.getFullYear()}.
        <a href="${SUPABASE_URL.replace('.supabase.co', '')}/gestion">Ver panel de gestión →</a>
      </p>
    </div>`;

  if (!RESEND_API_KEY || !OWNER_EMAIL) {
    return new Response(JSON.stringify({ ok: true, preview: html, warning: "RESEND_API_KEY o OWNER_EMAIL no configurados" }), { status: 200 });
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Illa Pancha <noreply@apartamentosillapancha.com>",
      to: OWNER_EMAIL,
      subject: `📊 Informe mensual — ${monthName}`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, month: monthName, reservations: total, income }), { status: 200 });
});
