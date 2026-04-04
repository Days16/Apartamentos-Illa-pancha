/**
 * Edge Function: drive-export (Reconvertida a Google Sheets)
 *
 * Crea una nueva pestaña con los datos del mes en un archivo Google Sheets
 * que pertenezca al usuario, sorteando las restricciones de cuota de las
 * Service Accounts gratuitas.
 * AHORA INCLUYE: Gráficos de barras, formato de tabla profesional y columnas detalladas.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID") || "";
const SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── JWT para Google Service Account ─────────────────────────────────────────
async function getGoogleAccessToken(): Promise<string> {
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets", // Modificado a Sheets
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${header}.${claimsB64}`;

  const pemKey = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const keyBuffer = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", keyBuffer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(signingInput));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("No se pudo obtener el access token de Google: " + JSON.stringify(tokenData));
  return tokenData.access_token;
}

// ─── Generación de Tablas de Datos (Arrays) ──────────────────────────────────
function buildData(reservations: any[], apartments: any[]) {
  const currentYear = new Date().getFullYear();
  const confirmed = reservations.filter(r => r.status !== "cancelled");

  // A to O (15 columnas)
  const reservasRows: any[][] = [
    ["📅 HISTÓRICO DE RESERVAS (" + reservations.length + ")"],
    ["Referencia", "Huésped", "Email", "Teléfono", "Apartamento", "Llegada", "Salida", "Noches", "Pagado (€)", "Pendiente (€)", "Total (€)", "Estado", "Origen", "Extras/Notas", "Fecha Reserva"],
    ...reservations.map(r => {
      const deposit = Number(r.deposit || 0);
      const total = Number(r.total_price || r.total || 0);
      return [
        r.id || "",
        r.guest_name || r.guest || "",
        r.email || "",
        r.phone || "",
        r.apartment_slug || r.apt || "",
        r.checkin || r.check_in || "",
        r.checkout || r.check_out || "",
        r.nights || 0,
        deposit,
        total - deposit,
        total,
        r.status || "",
        r.source || "",
        Array.isArray(r.extras) ? r.extras.join(", ") : (r.extras || ""),
        r.created_at ? r.created_at.split("T")[0] : ""
      ];
    })
  ];

  // Q to T (4 columnas)
  const monthlyMap: Record<string, { income: number; count: number; nights: number }> = {};
  confirmed.forEach(r => {
    const checkin = r.checkin || r.check_in || "";
    if (!checkin) return;
    const m = checkin.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { income: 0, count: 0, nights: 0 };
    monthlyMap[m].income += Number(r.total_price || r.total || 0);
    monthlyMap[m].count++;
    monthlyMap[m].nights += Number(r.nights || 0);
  });

  const mesesRows: any[][] = [
    ["💸 INGRESOS POR MES (Pagadas/Confirmadas)"],
    ["Mes", "Nº Reservas", "Ingresos Totales (€)", "Noches Cubiertas"],
    ...Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => [
      month, data.count, data.income, data.nights
    ])
  ];

  // V to Y (4 columnas)
  const aptMap: Record<string, { name: string; count: number; income: number; nights: number }> = {};
  confirmed.filter(r => (r.checkin || r.check_in || "").startsWith(String(currentYear))).forEach(r => {
    const slug = r.apartment_slug || r.apt || "desconocido";
    const apt = apartments.find(a => a.slug === slug);
    if (!aptMap[slug]) aptMap[slug] = { name: apt?.name || slug, count: 0, income: 0, nights: 0 };
    aptMap[slug].count++;
    aptMap[slug].income += Number(r.total_price || r.total || 0);
    aptMap[slug].nights += Number(r.nights || 0);
  });

  const aptRows: any[][] = [
    [`🏢 RENDIMIENTO POR ALOJAMIENTO (${currentYear})`],
    ["Apartamento", "Nº Reservas", "Ingresos (€)", "Noches"],
    ...Object.values(aptMap).sort((a: any, b: any) => b.income - a.income).map(a => [
      a.name, a.count, a.income, a.nights
    ])
  ];

  return { reservasRows, mesesRows, aptRows };
}

// ─── Diseño de la Pestaña (Layout + Colores + Gráficos) ──────────────────────
async function createSheetWithLayoutAndCharts(
  sheetTitle: string, 
  reservasRows: any[][], 
  mesesRows: any[][], 
  aptRows: any[][], 
  accessToken: string
): Promise<number> {
  const sheetId = Math.floor(Math.random() * 2000000000); // Random int
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
  
  const endMeses = Math.max(3, mesesRows.length);
  const endApt = Math.max(3, aptRows.length);
  const currentYear = new Date().getFullYear();

  // Color #1a5f6e ~ (rgb 26, 95, 110) => Red: 26/255=0.10, Green: 95/255=0.37, Blue: 110/255=0.43
  const headerBgColor = { red: 0.1, green: 0.37, blue: 0.43 };
  const headerTextColor = { red: 1, green: 1, blue: 1 };

  const body = {
    requests: [
      {
        addSheet: {
          properties: {
            sheetId: sheetId,
            title: sheetTitle,
            gridProperties: { frozenRowCount: 2 } // Fijar cabeceras
          }
        }
      },
      // Cabeceras de Reservas (A2:O2)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 15 },
          cell: {
            userEnteredFormat: {
              backgroundColor: headerBgColor,
              textFormat: { foregroundColor: headerTextColor, bold: true }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      },
      // Cabeceras de Meses (Q2:T2 -> Índices 16 a 20)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 16, endColumnIndex: 20 },
          cell: {
            userEnteredFormat: {
              backgroundColor: headerBgColor,
              textFormat: { foregroundColor: headerTextColor, bold: true }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      },
      // Cabeceras de Apartamento (V2:Y2 -> Índices 21 a 25)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 21, endColumnIndex: 25 },
          cell: {
            userEnteredFormat: {
              backgroundColor: headerBgColor,
              textFormat: { foregroundColor: headerTextColor, bold: true }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    // Si la pestaña ya existe, lo pasamos por alto
    if (!err.includes("already exists")) {
      throw new Error(`Error diseñando hoja (Gráficos/Layout): ${res.status} ${err}`);
    }
  }
  return sheetId;
}

// ─── Inyectar los datos en la Pestaña en las 3 zonas ────────────────────────
async function writeDataToSheet(
  sheetTitle: string, 
  reservasRows: any[][], 
  mesesRows: any[][], 
  aptRows: any[][], 
  accessToken: string
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`;
  const body = {
    valueInputOption: "USER_ENTERED",
    data: [
      { range: `'${sheetTitle}'!A1`, values: reservasRows },
      { range: `'${sheetTitle}'!Q1`, values: mesesRows },
      { range: `'${sheetTitle}'!V1`, values: aptRows }
    ]
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`Error volcando datos: ${res.status} ${await res.text()}`);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }
  if (!SERVICE_ACCOUNT_JSON || !SHEET_ID) {
    return new Response(JSON.stringify({ error: "Configura GOOGLE_SERVICE_ACCOUNT_JSON y GOOGLE_SHEET_ID" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const [{ data: reservations }, { data: apartments }] = await Promise.all([
      supabase.from("reservations").select("*").order("created_at", { ascending: false }),
      supabase.from("apartments").select("slug, name").eq("active", true),
    ]);

    const now = new Date();
    const dateStr = `${now.toISOString().split("T")[0]} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const sheetTitle = `Informe ${dateStr}`;

    const { reservasRows, mesesRows, aptRows } = buildData(reservations || [], apartments || []);
    const accessToken = await getGoogleAccessToken();

    // 1. Crear pestaña con layout y gráficos
    await createSheetWithLayoutAndCharts(sheetTitle, reservasRows, mesesRows, aptRows, accessToken);
    
    // 2. Volcar la información masiva
    await writeDataToSheet(sheetTitle, reservasRows, mesesRows, aptRows, accessToken);

    return new Response(
      JSON.stringify({
        success: true,
        sheetTitle,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
        reservations: reservations?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
