/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Basic iCal parser helper
function parseICalendar(icalData: string) {
    const events: any[] = [];
    const lines = icalData.split(/\r?\n/);
    let currentEvent: any = null;

    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.dtstart && currentEvent.dtend) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('DTSTART')) {
                // Handle DTSTART;VALUE=DATE:20230101 or DTSTART:20230101T120000Z
                const valStr = line.split(':')[1];
                if (valStr) currentEvent.dtstart = valStr.substring(0, 8); // YYYYMMDD
            } else if (line.startsWith('DTEND')) {
                const valStr = line.split(':')[1];
                if (valStr) currentEvent.dtend = valStr.substring(0, 8); // YYYYMMDD
            } else if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.substring(8);
            } else if (line.startsWith('UID:')) {
                currentEvent.uid = line.substring(4);
            }
        }
    });
    return events;
}

function convertDateStr(yyyyMmDd: string) {
    return `${yyyyMmDd.substring(0, 4)}-${yyyyMmDd.substring(4, 6)}-${yyyyMmDd.substring(6, 8)}`;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get all configured channels
        const { data: channels, error: channelsError } = await supabaseAdmin
            .from('ical_channels')
            .select('*')

        if (channelsError) throw channelsError

        const results = [];

        // 2. Process each channel
        for (const channel of channels) {
            try {
                const response = await fetch(channel.url);
                if (!response.ok) {
                    results.push({ channel: channel.id, status: 'failed', error: 'HTTP ' + response.status });
                    continue;
                }

                const icalText = await response.text();
                const events = parseICalendar(icalText);

                let importedCount = 0;

                for (const ev of events) {
                    const checkin = convertDateStr(ev.dtstart);
                    const checkout = convertDateStr(ev.dtend);
                    // Avoid inserting past events unnecessarily or generating massive data
                    if (new Date(checkout) < new Date()) continue;

                    const uid = ev.uid || `SYNC-${channel.platform}-${checkin}-${checkout}`;

                    // Check if block already exists by UID to avoid duplicates
                    const { data: existing } = await supabaseAdmin
                        .from('reservations')
                        .select('id')
                        .eq('id', uid)
                        .single();

                    if (!existing) {
                        // Calculate nights
                        const dIn = new Date(checkin).getTime();
                        const dOut = new Date(checkout).getTime();
                        const nights = Math.max(1, Math.round((dOut - dIn) / (1000 * 60 * 60 * 24)));

                        await supabaseAdmin.from('reservations').insert({
                            id: uid,
                            apartment_slug: channel.apartment_slug,
                            check_in_date: checkin,
                            check_out_date: checkout,
                            guest_name: `Bloqueo de ${channel.platform}`,
                            guest_email: `no-reply@${channel.platform}.com`,
                            guest_phone: '',
                            nights: nights,
                            total_price: 0,
                            status: 'confirmed',
                            origin: channel.platform
                        });
                        importedCount++;
                    }
                }

                // Update last sync time
                await supabaseAdmin.from('ical_channels')
                    .update({ last_sync: new Date().toISOString() })
                    .eq('id', channel.id);

                results.push({ channel: channel.id, status: 'success', imported: importedCount });
            } catch (e: any) {
                results.push({ channel: channel.id, status: 'failed', error: e.message });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
