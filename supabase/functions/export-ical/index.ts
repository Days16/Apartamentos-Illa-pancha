/// <reference types="https://deno.land/x/types/index.d.ts" />
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ical from 'https://esm.sh/ical-generator@4.1.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const slug = url.searchParams.get('slug')

        if (!slug) {
            return new Response(JSON.stringify({ error: 'Missing slug' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify apartment exists
        const { data: apt, error: aptError } = await supabaseAdmin
            .from('apartments')
            .select('name')
            .eq('slug', slug)
            .single()

        if (aptError || !apt) {
            return new Response(JSON.stringify({ error: 'Apartment not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Get active reservations
        const { data: reservations, error: resError } = await supabaseAdmin
            .from('reservations')
            .select('id, guest_name, check_in_date, check_out_date, status, origin')
            .eq('apartment_slug', slug)
            .not('status', 'eq', 'cancelled')

        if (resError) {
            throw resError
        }

        // Generate iCal
        const calendar = ical({
            name: `Illa Pancha - ${apt.name}`,
            timezone: 'Europe/Madrid'
        });

        reservations.forEach((res: any) => {
            // Create local dates for check-in and out
            const start = new Date(res.check_in_date + 'T15:00:00');
            const end = new Date(res.check_out_date + 'T11:00:00');

            calendar.createEvent({
                start: start,
                end: end,
                summary: res.status === 'blocked' ? 'Blocked' : `Reservation: ${res.guest_name}`,
                description: `Booking ID: ${res.id}\nSource: ${res.origin}\nStatus: ${res.status}`,
                uid: res.id,
                url: `https://illapancha.com/gestion/reservas?id=${res.id}`
            });
        });

        return new Response(calendar.toString(), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="illapancha-${slug}.ics"`
            },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
