/**
 * Edge Function: dynamic-pricing
 *
 * Calcula el precio final de una reserva aplicando las reglas de precios dinámicos.
 * Se llama desde el frontend al calcular el precio en BookingModal / ApartmentDetail.
 *
 * Variables de entorno:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY)
 *
 * Body del request (POST):
 * {
 *   basePrice: number,       — precio base por noche
 *   checkin: "YYYY-MM-DD",   — fecha de check-in
 *   apartmentSlug: string    — para calcular ocupación del mes
 * }
 *
 * Response:
 * {
 *   basePrice: number,
 *   finalPrice: number,
 *   modifier: number,        — % de modificación total (puede ser 0)
 *   appliedRules: Array<{ label, modifier }>
 * }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { basePrice, checkin, apartmentSlug } = await req.json();

    if (!basePrice || !checkin) {
      return new Response(
        JSON.stringify({ error: "basePrice y checkin son obligatorios" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Cargar reglas activas
    const { data: rules, error } = await supabase
      .from("dynamic_pricing_rules")
      .select("*")
      .eq("active", true);

    if (error) throw new Error(error.message);
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ basePrice, finalPrice: basePrice, modifier: 0, appliedRules: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkinDate = new Date(checkin + "T00:00:00");
    const now = new Date();
    const leadTimeDays = Math.floor((checkinDate.getTime() - now.getTime()) / 86400000);
    const currentHour = now.getHours();

    // Calcular % ocupación del mes del checkin
    let occupancyPct = 0;
    const checkinYear = checkinDate.getFullYear();
    const checkinMonth = checkinDate.getMonth();
    const monthStart = `${checkinYear}-${String(checkinMonth + 1).padStart(2, "0")}-01`;
    const monthEnd = `${checkinYear}-${String(checkinMonth + 2).padStart(2, "0")}-01`;

    const { data: monthReservations } = await supabase
      .from("reservations")
      .select("checkin, checkout, apartment_slug")
      .eq("status", "confirmed")
      .gte("checkin", monthStart)
      .lt("checkin", monthEnd);

    if (monthReservations) {
      const { data: apartments } = await supabase.from("apartments").select("slug").eq("active", true);
      const totalApts = apartments?.length || 1;
      const daysInMonth = new Date(checkinYear, checkinMonth + 1, 0).getDate();
      const maxDays = totalApts * daysInMonth;
      let occupiedDays = 0;
      monthReservations.forEach((r: any) => {
        const ci = new Date(r.checkin + "T00:00:00");
        const co = new Date(r.checkout + "T00:00:00");
        const ms = new Date(checkinYear, checkinMonth, 1);
        const me = new Date(checkinYear, checkinMonth, daysInMonth);
        const start = ci < ms ? ms : ci;
        const end = co > me ? me : co;
        if (end > start) occupiedDays += Math.round((end.getTime() - start.getTime()) / 86400000);
      });
      occupancyPct = maxDays > 0 ? Math.round((occupiedDays / maxDays) * 100) : 0;
    }

    // Aplicar reglas
    const appliedRules: Array<{ label: string; modifier: number }> = [];
    let totalModifier = 0;

    for (const rule of rules) {
      let value: number;
      if (rule.type === "lead_time") value = leadTimeDays;
      else if (rule.type === "occupancy") value = occupancyPct;
      else if (rule.type === "time_of_day") value = currentHour;
      else continue;

      const min = rule.condition_min ?? -Infinity;
      const max = rule.condition_max ?? Infinity;

      if (value >= min && value <= max) {
        totalModifier += Number(rule.modifier);
        appliedRules.push({ label: rule.label, modifier: Number(rule.modifier) });
      }
    }

    const finalPrice = Math.round(basePrice * (1 + totalModifier / 100) * 100) / 100;

    return new Response(
      JSON.stringify({ basePrice, finalPrice, modifier: totalModifier, appliedRules }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
