/**
 * Edge Function: auto-translate
 *
 * Traduce un texto del inglés (EN) a FR, DE y PT usando la API de DeepL.
 * Se llama desde el panel admin (WebTextos, ApartamentosAdmin) al pulsar "Auto-traducir".
 *
 * Variables de entorno necesarias en Supabase Dashboard → Settings → Edge Functions:
 *   DEEPL_API_KEY  — clave de la API de DeepL (gratuita hasta 500k caracteres/mes)
 *
 * Obtener clave gratuita en: https://www.deepl.com/es/pro-api
 *
 * Uso desde frontend:
 *   const { data } = await supabase.functions.invoke('auto-translate', {
 *     body: { text: 'Hello world', sourceLang: 'EN' }
 *   });
 *   // data = { FR: '...', DE: '...', PT: '...' }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const DEEPL_API_KEY = Deno.env.get("DEEPL_API_KEY") || "";
// DeepL Free usa api-free.deepl.com, DeepL Pro usa api.deepl.com
const DEEPL_BASE = DEEPL_API_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com"
  : "https://api.deepl.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await fetch(`${DEEPL_BASE}/v2/translate`, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: "EN",
      target_lang: targetLang,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.translations?.[0]?.text || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!DEEPL_API_KEY) {
    return new Response(
      JSON.stringify({ error: "DEEPL_API_KEY no configurada. Añádela en Supabase → Settings → Edge Functions." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  try {
    const { text, sourceLang = "EN" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "El campo 'text' es obligatorio." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const [fr, de, pt] = await Promise.all([
      translateText(text, "FR"),
      translateText(text, "DE"),
      translateText(text, "PT"),
    ]);

    return new Response(
      JSON.stringify({ FR: fr, DE: de, PT: pt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
