/**
 * Script de prueba: Flujo de Reseña Post-Estancia (Versión ESM)
 * 
 * Uso: node scripts/test-review-flow.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReviewFlow() {
  console.log('🚀 Iniciando prueba de flujo de reseñas...');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
    return;
  }

  // 1. Obtener una reserva reciente para probar
  const { data: reservations, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .limit(1);

  if (fetchError || !reservations || reservations.length === 0) {
    console.error('❌ No se encontraron reservas para probar o error en BD:', fetchError?.message);
    return;
  }

  const res = reservations[0];
  console.log(`📌 Usando reserva: ${res.id} (${res.guest})`);

  // 2. Verificar review_token
  if (!res.review_token) {
    console.warn('⚠️ La reserva no tiene review_token. ¿Has ejecutado el SQL en Supabase?');
    // Si la columna no existe, el invoke de abajo fallará o enviará undefined
  }

  // 3. Invocar la Edge Function manualmente
  console.log('📧 Invocando Edge Function post-stay-review...');
  
  try {
    const { data: result, error: invokeError } = await supabase.functions.invoke('post-stay-review', {
      body: {
        guestEmail: res.email,
        guestName: res.guest,
        apartmentName: res.apt,
        reservationId: res.id,
        reviewToken: res.review_token || '00000000-0000-0000-0000-000000000000',
        manual: true
      }
    });

    if (invokeError) {
      console.error('❌ Error invocando la función:', invokeError);
      console.log('💡 Tip: Asegúrate de que la Edge Function esté desplegada y las variables de entorno configuradas.');
      return;
    }

    console.log('✅ Edge Function respondida:', result);
    console.log('\n--- PRUEBA COMPLETADA ---');
    console.log(`Token usado: ${res.review_token || 'ninguno'}`);
    console.log(`URL de reseña web: http://localhost:5173/dejar-resena?token=${res.review_token || 'null'}`);
    console.log('-------------------------');

  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testReviewFlow();
