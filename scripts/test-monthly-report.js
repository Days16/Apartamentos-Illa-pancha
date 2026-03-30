/**
 * Script de prueba: Informe Mensual de Estadísticas (Versión ESM)
 * 
 * Uso: node scripts/test-monthly-report.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMonthlyReport() {
  console.log('📊 Iniciando prueba de informe mensual...');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
    return;
  }

  console.log('📧 Invocando Edge Function monthly-report...');
  
  try {
    const { data: result, error: invokeError } = await supabase.functions.invoke('monthly-report');

    if (invokeError) {
      console.error('❌ Error invocando la función:', invokeError);
      console.log('💡 Tip: Asegúrate de que la Edge Function esté desplegada y las variables OWNER_EMAIL y RESEND_API_KEY configuradas en los Secrets de Supabase.');
      return;
    }

    console.log('✅ Edge Function respondida:', result);
    
    if (result.preview) {
      console.log('\n--- VISTA PREVIA DEL INFORME (HTML) ---');
      console.log('El informe se ha generado pero parece que faltan credenciales de Resend para el envío real.');
      console.log('Puedes ver el contenido del informe en los logs de arriba.');
      console.log('---------------------------------------');
    } else {
      console.log('\n--- INFORME ENVIADO CON ÉXITO ---');
      console.log(`Mes: ${result.month}`);
      console.log(`Total reservas: ${result.reservations}`);
      console.log(`Ingresos: ${result.income}€`);
      console.log('---------------------------------');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testMonthlyReport();
