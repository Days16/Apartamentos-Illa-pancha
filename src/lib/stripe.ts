import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Compatibilidad: se prioriza la variable estándar del proyecto.
const stripePublicKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  'pk_test_placeholder';
const isLiveStripeKey = stripePublicKey.startsWith('pk_live_');

function isHttpsOrLocalhost() {
  if (typeof window === 'undefined') return true;
  const { protocol, hostname } = window.location;
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

if (typeof window !== 'undefined' && isLiveStripeKey && !isHttpsOrLocalhost()) {
  // En producción con clave live, forzamos HTTPS para cumplir requisitos de Stripe.js.
  const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(httpsUrl);
}

// Singleton de Stripe (se reutiliza en toda la app)
export const stripePromise =
  isLiveStripeKey && !isHttpsOrLocalhost() ? Promise.resolve(null) : loadStripe(stripePublicKey);

interface PaymentData {
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName: string;
  reservationId: string;
  description?: string;
  turnstileToken?: string;
}

export async function createPaymentIntent(paymentData: PaymentData) {
  try {
    if (!supabase) {
      throw new Error(
        'Supabase no está inicializado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
      );
    }
    if (typeof supabase.functions?.invoke !== 'function') {
      throw new Error(
        'supabase.functions.invoke no es una función. Revisa tu configuración de Supabase'
      );
    }

    // El importe se lee en el servidor desde la BD — no lo enviamos desde el cliente
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        reservationId: paymentData.reservationId,
        customerName: paymentData.customerName,
        turnstileToken: paymentData.turnstileToken,
      },
    });

    if (error) {
      console.error('Supabase error response:', error);
      
      // Si el error viene de la Edge Function, el mensaje real suele estar en el cuerpo de la respuesta
      let errorMessage = error.message;
      if (data && typeof data === 'object' && 'error' in data) {
        errorMessage = String((data as { error: string }).error);
      }
      
      throw new Error(errorMessage || 'Error creando PaymentIntent en Supabase');
    }

    if (!data || !data.clientSecret) {
      throw new Error('Respuesta inválida de PaymentIntent: falta clientSecret');
    }

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (err) {
    console.error('createPaymentIntent error:', (err as Error).message || err);
    throw err;
  }
}

/**
 * Confirmar pago con Stripe Elements
 * @param {Object} stripe - Instancia de Stripe
 * @param {Object} elements - Instancia de Elements
 * @param {string} clientSecret - Client secret del PaymentIntent
 * @returns {Promise<Object>} Resultado de confirmación
 */
export async function confirmPayment(
  stripe: {
    confirmCardPayment: (
      secret: string,
      opts: unknown
    ) => Promise<{ error?: { message?: string }; paymentIntent?: unknown }>;
  },
  elements: { getElement: (type: string) => unknown },
  clientSecret: string
) {
  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement('card'),
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      paymentIntent: result.paymentIntent,
    };
  } catch (err) {
    console.error('Payment confirmation error:', err);
    throw err;
  }
}
