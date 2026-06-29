import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Sincronización horaria: Dashboard → Database → Cron (pg_cron + pg_net) o SQL:
//   Schedule: 0 * * * *  (cada hora en punto UTC)
//   Recomendado: secretos project_url y anon_key en Vault, luego:
//   select cron.schedule(
//     'sync-ical-hourly',
//     '0 * * * *',
//     $$ select net.http_post(
//          url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1) || '/functions/v1/sync-ical',
//          headers := jsonb_build_object(
//            'Content-Type', 'application/json',
//            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key' limit 1),
//            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key' limit 1)
//          ),
//          body := '{}'::jsonb
//        ); $$
//   );
// Doc: https://supabase.com/docs/guides/functions/schedule-functions

import { getCorsHeaders } from "../_shared/cors.ts";

// ─── Parser iCal ──────────────────────────────────────────────────────────────
interface ICalEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: string; // YYYY-MM-DD
  dtend: string;   // YYYY-MM-DD
}

function parseIcal(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

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
    if (!line.includes(":")) continue;

    const firstColon = line.indexOf(":");
    const propPart = line.slice(0, firstColon);
    const value = line.slice(firstColon + 1).trim();
    const propName = propPart.split(";")[0].toUpperCase();

    if (propName === "BEGIN" && value === "VEVENT") {
      inEvent = true;
      current = {};
    } else if (propName === "END" && value === "VEVENT") {
      if (current.uid && current.dtstart && current.dtend) {
        events.push(current as ICalEvent);
      }
      inEvent = false;
    } else if (inEvent) {
      if (propName === "UID") {
        current.uid = value;
      } else if (propName === "SUMMARY") {
        current.summary = value;
      } else if (propName === "DESCRIPTION") {
        current.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";");
      } else if (propName === "DTSTART") {
        current.dtstart = parseDate(value);
      } else if (propName === "DTEND") {
        current.dtend = parseDate(value);
      }
    }
  }
  return events;
}

function parseDate(val: string): string {
  let s = val.trim();
  if (s.includes(":")) {
    const afterColon = s.slice(s.lastIndexOf(":") + 1).trim();
    if (/^\d{8}/.test(afterColon) || /^\d{4}-\d{2}-\d{2}/.test(afterColon)) {
      s = afterColon;
    }
  }
  const clean = s.replace(/T.*/, "").replace(/Z$/i, "").replace(/-/g, "");
  if (clean.length >= 8 && /^\d{8}/.test(clean)) {
    const ymd = clean.slice(0, 8);
    return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`.slice(0, 10);
  return s.slice(0, 10);
}

interface BookingInfo {
  guestName: string;
  phone: string;
  email: string;
  bookingRef: string;
  adults: string;
  children: string;
}

function parseBookingDescription(description: string): BookingInfo {
  const get = (label: string): string => {
    const regex = new RegExp(`${label}[:\\s]+([^\\n]+)`, "i");
    return description.match(regex)?.[1]?.trim() ?? "";
  };

  return {
    guestName:
      get("GUEST NAME") ||
      get("NAME") ||
      get("HUÉSPED") ||
      get("HUESPED") ||
      get("HÓSPEDE"),
    phone:      get("PHONE") || get("TEL"),
    email:      get("EMAIL"),
    bookingRef: get("BOOKING REFERENCE") || get("BOOKING REF") || get("RESERVATION ID"),
    adults:     get("ADULTS"),
    children:   get("CHILDREN"),
  };
}

const PLATFORM_GUEST_FALLBACK: Record<string, string> = {
  booking:  "Reserva Booking",
  avaibook: "Reserva Avaibook",
  airbnb:   "Reserva Airbnb",
};

function isPlaceholderGuestName(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  const lower = n.toLowerCase();
  if (lower.includes("not available")) return true;
  if (lower.includes("no disponible")) return true;
  if (lower.includes("blocked")) return true;
  if (lower === "airbnb") return true;
  if (lower === "avaibook") return true;
  if (/\bclosed\b/i.test(n) && (/\bhuésped\b/i.test(n) || /\bhuesped\b/i.test(n) || /\bguest\b/i.test(n))) {
    return true;
  }
  if (/^closed\b/i.test(n)) return true;
  if (/^huésped$/i.test(n) || /^huesped$/i.test(n) || /^guest$/i.test(n)) return true;
  return false;
}

function resolveGuestDisplay(rawGuest: string, summary: string, platform: string): string {
  const candidates = [rawGuest.trim(), (summary || "").trim()].filter(Boolean);
  for (const c of candidates) {
    if (c && !isPlaceholderGuestName(c)) return c;
  }
  return PLATFORM_GUEST_FALLBACK[platform] ?? "Reserva externa";
}

// Genera un ID estilo web IP-XXXXXX (6 dígitos aleatorios)
function generateWebId(): string {
    return "IP-" + (Math.floor(Math.random() * 900000) + 100000);
}

function isValidICalUrl(rawUrl: string): boolean {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return false; }
  if (!["https:", "http:"].includes(parsed.protocol)) return false;
  const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blocked.includes(parsed.hostname)) return false;
  if (/^169\.254\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\./.test(parsed.hostname)) return false;
  return true;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Obtener orígenes y precios de apartamentos
    const { data: sources, error: srcErr } = await supabase
      .from("ical_sources")
      .select("*");

    if (srcErr) {
      console.error("Error fetching ical_sources:", srcErr);
      return new Response(JSON.stringify({ error: `Failed to fetch sources: ${srcErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener apartamentos para mapear precios
    const { data: apartments, error: aptErr } = await supabase
      .from("apartments")
      .select("slug, name, internal_name, price");

    if (aptErr) {
      console.error("Error fetching apartments:", aptErr);
      return new Response(JSON.stringify({ error: `Failed to fetch apartments: ${aptErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aptMap = new Map(apartments?.map(a => [a.slug, a]) || []);

    let targetId: string | null = null;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (body.id) targetId = body.id;
      }
    } catch { /* no body */ }

    const activeSources = (sources || []).filter((s: any) => s.active !== false);
    const toSync = targetId
      ? (sources || []).filter((s: any) => s.id === targetId)
      : activeSources;

    const results: any[] = [];

    for (const source of toSync) {
      const aptInfo = aptMap.get(source.apartment_slug);
      if (!aptInfo) {
        console.warn(`Skipping source ${source.id}: apartment ${source.apartment_slug} not found`);
        const msg = `Apartment ${source.apartment_slug} not found`;
        await supabase
          .from("ical_sources")
          .update({
            last_sync: new Date().toISOString(),
            last_status: "error",
            last_message: msg,
          })
          .eq("id", source.id);
        results.push({ id: source.id, status: "error", error: msg });
        continue;
      }

      try {
      if (!isValidICalUrl(source.url)) {
        throw new Error(`URL iCal no permitida: ${source.url}`);
      }

      const res = await fetch(source.url, {
        headers: { "User-Agent": "IllaPancha/1.0 iCalSync" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} al obtener ${source.url}`);
      const text = await res.text();
      const MAX_ICAL_SIZE = 5 * 1024 * 1024;
      if (text.length > MAX_ICAL_SIZE) {
        throw new Error("Archivo iCal demasiado grande (máx 5 MB)");
      }
      const events = parseIcal(text);
      const fetchedUids: string[] = [];
      const aptName = aptInfo?.internal_name || aptInfo?.name || source.apartment_slug;
      const aptPrice = aptInfo?.price || 0;

      for (const ev of events) {
        // Saltar eventos exportados por este propio sistema para evitar bucles de importación
        if (ev.uid.endsWith("@illapancha")) continue;

        const ical_uid = `${source.id}:${ev.uid}`;
        fetchedUids.push(ical_uid);

        const nights = Math.max(1, Math.round(
          (new Date(ev.dtend).getTime() - new Date(ev.dtstart).getTime()) / 86400000
        ));

        // Calcular total estimado
        const estimatedTotal = nights * aptPrice;

        const platform = source.platform ?? "booking";
        const info = parseBookingDescription(ev.description ?? "");
        const guestName = resolveGuestDisplay(
          info.guestName || "",
          ev.summary || "",
          platform,
        );

        // Construir etiqueta de huésped enriquecida (ref + pax) sin columnas extra
        const guestParts: string[] = [];
        if (info.bookingRef) guestParts.push(`Ref: ${info.bookingRef}`);
        if (info.adults)     guestParts.push(`${info.adults} ad.`);
        if (info.children)   guestParts.push(`${info.children} niños`);
        const guestLabel = guestParts.length > 0
          ? `${guestName} (${guestParts.join(", ")})`
          : guestName;

        const reservationData = {
          ical_uid,
          apt_slug:      source.apartment_slug,
          apt:           aptName,
          guest:         guestLabel,
          checkin:       ev.dtstart,
          checkout:      ev.dtend,
          nights,
          total:         estimatedTotal,
          deposit:       0,
          status:        "confirmed",
          source:        source.platform ?? "booking",
          email:         info.email || "",
          phone:         info.phone || null,
          extras:        [],
          extras_total:  0,
          cash_paid:     false,
        };

        const { data: existing } = await supabase
          .from("reservations")
          .select("id, status")
          .eq("ical_uid", ical_uid)
          .maybeSingle();

        if (existing?.id) {
          // Si fue cancelada manualmente, no reactivar
          if (existing.status === "cancelled") {
            console.log(`Skipping ${ical_uid}: manually cancelled, will not reactivate`);
            continue;
          }
          const { error: updErr } = await supabase
            .from("reservations")
            .update(reservationData)
            .eq("id", existing.id);
          if (updErr) {
            console.error(`Error updating reservation ${existing.id}:`, updErr.message);
          }
        } else {
          // Antes de insertar, verificar que no haya otra reserva que cubra estas fechas
          const { data: overlapping, error: overlapErr } = await supabase
            .from("reservations")
            .select("id, ical_uid")
            .eq("apt_slug", source.apartment_slug)
            .neq("status", "cancelled")
            .neq("ical_uid", ical_uid)
            .lt("checkin", ev.dtend)
            .gt("checkout", ev.dtstart);

          if (overlapErr) {
            console.error(`Overlap check failed for ${ical_uid}, skipping insert:`, overlapErr.message);
            continue;
          }

          if (overlapping && overlapping.length > 0) {
            console.log(`Skipping ${ical_uid}: dates ${ev.dtstart}–${ev.dtend} already covered by ${overlapping[0].ical_uid ?? overlapping[0].id}`);
            continue;
          }

          // Nueva con ID estilo web IP-XXXXXX
          const newId = generateWebId();
          const { error: insErr } = await supabase
            .from("reservations")
            .insert({ ...reservationData, id: newId });

          if (insErr) {
            console.error(`Error inserting ical reservation ${ical_uid}:`, insErr.message);
            throw new Error(`Error al crear reserva iCal: ${insErr.message}`);
          }

          await supabase.functions.invoke("send-owner-notification", {
            body: {
              type: "booking",
              reservationId: newId,
              guestName,
              guestEmail: info.email || "No proporcionado",
              apartmentName: aptName,
              checkin: ev.dtstart,
              checkout: ev.dtend,
              nights,
              total: estimatedTotal,
              deposit: 0,
              panelUrl: "https://apartamentosillapancha.com/gestion"
            }
          }).catch(() => {});
        }
      }

      // Eliminar bloqueos iCal que ya no están en el feed (también si el .ics va vacío)
      try {
        const { data: existing } = await supabase
          .from("reservations")
          .select("id, ical_uid")
          .eq("apt_slug", source.apartment_slug)
          .not("ical_uid", "is", null)
          .like("ical_uid", `${source.id}:%`);

        if (existing && existing.length > 0) {
          const toRemove = existing.filter((r: any) => !fetchedUids.includes(r.ical_uid));
          for (const item of toRemove) {
            await supabase.from("reservations").delete().eq("id", item.id);
          }
        }
      } catch (cleanupErr: any) {
        console.error(`Cleanup warning for source ${source.id}:`, cleanupErr.message);
      }

      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("ical_sources")
        .update({ last_sync: now, last_status: "ok", last_message: null })
        .eq("id", source.id);

      if (updateErr) {
        console.error(`Error updating ical_sources for source ${source.id}:`, updateErr);
        results.push({ id: source.id, status: "warning", message: "Sync OK but metadata update failed", error: updateErr.message });
      } else {
        results.push({ id: source.id, status: "ok" });
      }
    } catch (err: any) {
      console.error(`Error syncing source ${source.id}:`, err);
      const errText = err.message || String(err);
      await supabase
        .from("ical_sources")
        .update({
          last_sync: new Date().toISOString(),
          last_status: "error",
          last_message: errText.length > 500 ? errText.slice(0, 500) : errText,
        })
        .eq("id", source.id);
      results.push({ id: source.id, status: "error", error: errText });
    }
  }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (globalErr: any) {
    console.error("Global sync-ical error:", globalErr);
    return new Response(
      JSON.stringify({ error: `Sync failed: ${globalErr.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
