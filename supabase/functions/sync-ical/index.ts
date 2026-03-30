import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Parser iCal minimalista ──────────────────────────────────────────────────
interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string; // YYYY-MM-DD
  dtend: string;   // YYYY-MM-DD
}

function parseIcal(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Unfold continued lines (RFC 5545: line starting with space/tab continues previous)
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  let inEvent = false;
  let current: Partial<ICalEvent> = {};

  for (const line of unfolded) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      current = {};
    } else if (line.startsWith("END:VEVENT")) {
      if (current.uid && current.dtstart && current.dtend) {
        events.push(current as ICalEvent);
      }
      inEvent = false;
    } else if (inEvent) {
      // UID
      if (line.startsWith("UID:")) {
        current.uid = line.slice(4).trim();
      }
      // SUMMARY
      else if (line.startsWith("SUMMARY:")) {
        current.summary = line.slice(8).trim();
      }
      // DTSTART — puede ser DTSTART;VALUE=DATE:20240615 o DTSTART:20240615T000000Z
      else if (line.startsWith("DTSTART")) {
        const val = line.split(":").slice(1).join(":");
        current.dtstart = parseDate(val.trim());
      }
      // DTEND
      else if (line.startsWith("DTEND")) {
        const val = line.split(":").slice(1).join(":");
        current.dtend = parseDate(val.trim());
      }
    }
  }
  return events;
}

function parseDate(val: string): string {
  // Formato fecha: 20240615 o 20240615T000000Z
  const digits = val.replace(/T.*/, "").replace(/-/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return val.slice(0, 10); // fallback
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Acepta POST para sync manual (desde panel admin) o GET para cron
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  // Leer todas las fuentes iCal
  const { data: sources, error: srcErr } = await supabase
    .from("ical_sources")
    .select("*");

  if (srcErr) {
    return new Response(JSON.stringify({ error: srcErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Si se pasa un id concreto en el body, solo sincronizar ese
  let targetId: string | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.id) targetId = body.id;
    }
  } catch { /* no body */ }

  const toSync = targetId
    ? (sources || []).filter((s: any) => s.id === targetId)
    : (sources || []);

  const results: any[] = [];

  for (const source of toSync) {
    try {
      // Fetch .ics
      const res = await fetch(source.url, {
        headers: { "User-Agent": "IllaPancha/1.0 iCalSync" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} al obtener ${source.url}`);
      const text = await res.text();

      if (!text.includes("BEGIN:VCALENDAR")) {
        throw new Error("Respuesta no es un iCal válido");
      }

      const events = parseIcal(text);

      // Upsert cada evento como reserva bloqueada
      const fetchedUids: string[] = [];

      for (const ev of events) {
        const uid = `booking-${source.apartment_slug}-${ev.uid}`;
        fetchedUids.push(uid);

        const nights = Math.max(1, Math.round(
          (new Date(ev.dtend).getTime() - new Date(ev.dtstart).getTime()) / 86400000
        ));

        const reservationData = {
          ical_uid:    uid,
          apt_slug:    source.apartment_slug,
          apt:         source.apartment_slug,
          guest:       ev.summary || "Reserva Booking.com",
          checkin:     ev.dtstart,
          checkout:    ev.dtend,
          nights,
          total:       0,
          deposit:     0,
          status:      "confirmed",
          source:      "booking",
          email:       "",
          phone:       null,
          extras:      [],
          extras_total: 0,
          cash_paid:   false,
        };

        await supabase
          .from("reservations")
          .upsert(reservationData, { onConflict: "ical_uid" });
      }

      // Eliminar reservas de esta fuente que ya no están en el feed
      if (fetchedUids.length > 0) {
        await supabase
          .from("reservations")
          .delete()
          .eq("source", "booking")
          .eq("apt_slug", source.apartment_slug)
          .like("ical_uid", `booking-${source.apartment_slug}-%`)
          .not("ical_uid", "in", `(${fetchedUids.map(u => `"${u}"`).join(",")})`);
      }

      // Actualizar estado de la fuente
      await supabase
        .from("ical_sources")
        .update({ last_sync: new Date().toISOString(), last_status: "ok", last_message: `${events.length} eventos` })
        .eq("id", source.id);

      results.push({ id: source.id, apartment_slug: source.apartment_slug, status: "ok", events: events.length });

    } catch (err: any) {
      await supabase
        .from("ical_sources")
        .update({ last_sync: new Date().toISOString(), last_status: "error", last_message: err.message })
        .eq("id", source.id);

      results.push({ id: source.id, apartment_slug: source.apartment_slug, status: "error", error: err.message });
    }
  }

  return new Response(JSON.stringify({ synced: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
