import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const {
            guestEmail,
            guestName,
            apartmentName,
            checkin,
            checkout,
            nights,
            total,
            deposit,
            reservationId
        } = await req.json();

        const depositFormatted = typeof deposit === 'number' ? deposit.toFixed(2) : deposit;
        const totalFormatted = typeof total === 'number' ? total.toFixed(2) : total;
        const remaining = (parseFloat(total) - parseFloat(deposit)).toFixed(2);

        const result = await resend.emails.send({
            from: "Illa Pancha Ribadeo <onboarding@resend.dev>", // Cambia a tu dominio web verificado en produccion
            to: guestEmail,
            subject: `Confirmación de reserva ${reservationId} — Illa Pancha Ribadeo`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #1a5f6e; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 32px;">Illa Pancha Ribadeo</h1>
          </div>
          <div style="background: #f9f9f9; padding: 40px;">
            <h2 style="color: #1a5f6e;">¡Reserva Confirmada!</h2>
            <p>Hola <strong>${guestName}</strong>,<br><br>Tu reserva ha sido confirmada:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Referencia</td><td style="text-align: right; border-bottom: 1px solid #ddd;">${reservationId}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Apartamento</td><td style="text-align: right; border-bottom: 1px solid #ddd;">${apartmentName}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Fechas</td><td style="text-align: right; border-bottom: 1px solid #ddd;">${checkin} → ${checkout} (${nights} noches)</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Total Base</td><td style="text-align: right; font-weight: bold; color: #1a5f6e;">${totalFormatted}€</td></tr>
            </table>
            <div style="background: #e6f7fa; padding: 15px; border-radius: 4px;">
              <p style="margin: 0;"><strong>💳 Pagado (50%):</strong> ${depositFormatted}€<br><strong>💵 Pendiente al llegar:</strong> ${remaining}€</p>
            </div>
            <p>Si tienes alguna duda, responde a este correo.</p>
          </div>
        </div>
      `,
        });

        return new Response(JSON.stringify({ success: true, id: result.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
