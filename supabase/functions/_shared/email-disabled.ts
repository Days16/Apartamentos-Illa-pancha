// Interruptor global de envío de correos.
// Mientras esté en `true`, ninguna Edge Function envía correos reales
// (Resend nunca se llega a invocar); solo se devuelve una respuesta simulada.
// Pon esto en `false` para volver a activar el envío de correos.
export const EMAIL_SENDING_DISABLED = true;

export function disabledEmailResponse(corsHeaders: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({
      success: true,
      ok: true,
      disabled: true,
      reason: "El envío de correos está desactivado",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
