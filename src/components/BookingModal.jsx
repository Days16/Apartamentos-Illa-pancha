import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Ico, { paths } from './Ico';
import { supabase } from '../lib/supabase';
import { createPaymentIntent, confirmPayment } from '../lib/stripe';
import { sendBookingConfirmation } from '../services/resendService';
import { fetchExtras } from '../services/supabaseService';
import { useDiscount } from '../contexts/DiscountContext';

export default function BookingModal({ onClose, apartment }) {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [checkinDate, setCheckinDate] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [allExtras, setAllExtras] = useState([]);

  // Cargar extras desde Supabase
  useEffect(() => {
    fetchExtras().then(setAllExtras).catch(err => {
      console.error('Error loading extras:', err);
      setAllExtras([]);
    });
  }, []);

  const steps = ['Fechas', 'Datos', 'Extras', 'Pagar', 'Confirmado'];

  const apt = apartment || { name: 'Apt. Cantábrico', price: 140 };

  // Calcular noches dinámicamente
  const calculateNights = () => {
    if (!checkinDate || !checkoutDate) return 0;
    const diffTime = Math.abs(checkoutDate - checkinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const { activeDiscount } = useDiscount();
  const nights = calculateNights();
  const cleaningFee = 40;
  const subtotal = apt.price * nights;

  let discountAmount = 0;
  if (activeDiscount) {
    discountAmount = Math.round(subtotal * (activeDiscount.discount_percentage / 100));
  }
  const subtotalWithDiscount = subtotal - discountAmount;

  const activeExtras = allExtras.filter(e => e.active);

  const extrasTotal = selectedExtras.reduce((sum, id) => {
    const extra = activeExtras.find(e => e.id === id);
    return sum + (extra ? extra.price : 0);
  }, 0);

  const total = subtotalWithDiscount + cleaningFee + extrasTotal;
  const depositPct = apt.deposit_percentage !== undefined ? apt.deposit_percentage : 50;
  const deposit = Math.round(total * (depositPct / 100));

  // Formatear fechas para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const checkin = formatDate(checkinDate);
  const checkout = formatDate(checkoutDate);

  const toggleExtra = (id) => {
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePayment = async () => {
    if (!checkinDate || !checkoutDate) {
      setStripeError('Por favor selecciona las fechas de entrada y salida');
      return;
    }

    if (!form.name || !form.email || !form.phone) {
      setStripeError('Por favor completa todos los datos');
      return;
    }

    if (!stripe || !elements) {
      setStripeError('Stripe no está cargado correctamente');
      return;
    }

    setLoading(true);
    setStripeError('');

    try {
      // Crear ID de reserva
      const reservationId = 'IP-' + Math.floor(Math.random() * 900000 + 100000);

      // 1. Crear PaymentIntent en Edge Function
      const paymentData = await createPaymentIntent({
        amount: deposit,
        currency: 'eur',
        customerEmail: form.email,
        customerName: form.name,
        reservationId: reservationId,
        description: `${apartment?.name || 'Apt. Cantábrico'} - ${nights} noches`,
      });

      // 2. Confirmar pago con Stripe Elements
      const paymentResult = await confirmPayment(stripe, elements, paymentData.clientSecret);

      if (!paymentResult.success) {
        throw new Error('Error en confirmación de pago');
      }

      // 3. Crear registro de reserva en Supabase
      const { error: insertError } = await supabase
        .from('reservations')
        .insert([{
          id: reservationId,
          guest_name: form.name,
          guest_email: form.email,
          guest_phone: form.phone,
          apartment_slug: apartment?.slug || 'cantabrico',
          check_in: checkin,
          check_out: checkout,
          nights: nights,
          total_price: total,
          deposit_paid: deposit,
          extras: selectedExtras,
          status: 'confirmed',
          stripe_payment_intent: paymentData.paymentIntentId,
          created_at: new Date().toISOString(),
        }]);

      if (insertError) throw insertError;

      // 4. Enviar email de confirmación con Resend
      try {
        await sendBookingConfirmation({
          guestEmail: form.email,
          guestName: form.name,
          apartmentName: apartment?.name || 'Apt. Cantábrico',
          checkin: checkin,
          checkout: checkout,
          nights: nights,
          total: total,
          deposit: deposit,
          id: reservationId,
        });
      } catch (emailError) {
        console.warn('Email envío fallido pero reserva creada:', emailError);
      }

      // 5. Generar PDF de factura
      try {
        const { generateInvoice } = await import('../utils/generateInvoice');
        generateInvoice({
          id: reservationId,
          guest_name: form.name,
          guest_email: form.email,
          apartment_name: apartment?.name || 'Apt. Cantábrico',
          checkin: checkin,
          checkout: checkout,
          nights: nights,
          total: total,
          deposit: deposit,
        });
      } catch (pdfError) {
        console.warn('PDF generación fallida:', pdfError);
      }

      setStep(4);
    } catch (err) {
      setStripeError(err.message || 'Error procesando el pago. Intenta de nuevo.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="booking-modal">
        {/* PANEL IZQUIERDO */}
        <div className="booking-left">
          <div className="booking-step-label">
            {steps.map((s, i) => (
              <span key={i} className={`booking-step ${step >= i ? 'active' : ''}`}>
                {String(i + 1).padStart(2, '0')} {s}
              </span>
            ))}
          </div>

          <div className="booking-title" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#ffffff' }}>
            {step === 0 && 'Elige tus fechas'}
            {step === 1 && 'Tus datos'}
            {step === 2 && 'Extras'}
            {step === 3 && 'Pago seguro'}
            {step === 4 && '¡Confirmado!'}
          </div>
          <div className="booking-sub">
            {step < 4
              ? `${apt.name} · ${checkin} – ${checkout} · 2 huéspedes`
              : 'Te hemos enviado la confirmación por email'}
          </div>

          {step < 4 && (
            <>
              <div className="booking-summary-row">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{nights} noches × {apt.price} €</span>
                <span style={{ textDecoration: discountAmount > 0 ? 'line-through' : 'none', opacity: discountAmount > 0 ? 0.6 : 1 }}>{subtotal} €</span>
              </div>
              {discountAmount > 0 && (
                <div className="booking-summary-row" style={{ color: '#4CAF50', marginTop: -8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12 }}>Oferta aplicada: {activeDiscount.discount_code || 'Promo'} (-{activeDiscount.discount_percentage}%)</span>
                  <span style={{ fontWeight: 600 }}>-{discountAmount} €</span>
                </div>
              )}
              <div className="booking-summary-row">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>Limpieza final</span>
                <span>{cleaningFee} €</span>
              </div>
              {extrasTotal > 0 && (
                <div className="booking-summary-row">
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>Extras ({selectedExtras.length})</span>
                  <span>{extrasTotal} €</span>
                </div>
              )}
              <div className="booking-summary-row" style={{ borderBottom: 'none' }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18 }}>Total</span>
                <strong style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>{total} €</strong>
              </div>
              <div className="booking-highlight">
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 12 }}>
                  Modelo de pago
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>💳 Tarjeta ahora ({depositPct}%)</span>
                  <span style={{ fontWeight: 600 }}>{deposit} €</span>
                </div>
                {depositPct < 100 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>💵 Resto al llegar ({100 - depositPct}%)</span>
                    <span style={{ fontWeight: 600 }}>{total - deposit} €</span>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <div style={{ marginTop: 24 }}>
              {[
                ['Referencia', 'IP-' + Math.floor(Math.random() * 900 + 100)],
                ['Apartamento', apt.name],
                ['Entrada', checkin],
                ['Salida', checkout],
                ['Depositado', `${deposit} € ✓`],
                ...(depositPct < 100 ? [['Resto al llegar', `${total - deposit} €`]] : []),
                ...(selectedExtras.length > 0 ? [['Extras', `${selectedExtras.length} seleccionado${selectedExtras.length > 1 ? 's' : ''}`]] : []),
              ].map(([k, v], i) => (
                <div key={i} className="booking-summary-row">
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{k}</span>
                  <span style={{ fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DERECHO */}
        <div className="booking-right" style={{ position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <Ico d={paths.close} size={20} />
          </button>

          {/* PASO 0: FECHAS */}
          {step === 0 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 32 }}>
                Elige tus fechas
              </div>
              <label className="form-label">Entrada</label>
              <DatePicker
                selected={checkinDate}
                onChange={date => setCheckinDate(date)}
                minDate={new Date()}
                maxDate={checkoutDate ? new Date(checkoutDate.getTime() - 86400000) : null}
                dateFormat="dd/MM/yyyy"
                className="form-input"
                placeholderText="Selecciona fecha de entrada"
              />
              <label className="form-label" style={{ marginTop: 16 }}>Salida</label>
              <DatePicker
                selected={checkoutDate}
                onChange={date => setCheckoutDate(date)}
                minDate={checkinDate ? new Date(checkinDate.getTime() + 86400000) : new Date()}
                dateFormat="dd/MM/yyyy"
                className="form-input"
                placeholderText="Selecciona fecha de salida"
              />
              {nights > 0 && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  📅 {nights} noche{nights > 1 ? 's' : ''} × {apt.price}€/noche = {subtotal}€
                </div>
              )}
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginTop: 28, marginBottom: 28 }}>
                Al continuar aceptas nuestros{' '}
                <a href="/terminos" target="_blank" style={{ color: '#1a5f6e', textDecoration: 'underline' }}>términos y condiciones</a> y{' '}
                <a href="/privacidad" target="_blank" style={{ color: '#1a5f6e', textDecoration: 'underline' }}>política de privacidad</a>.<br />
                Cancelación gratuita hasta 14 días antes de la llegada.
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: 16, fontSize: 13, letterSpacing: '0.12em' }}
                onClick={() => setStep(1)}
                disabled={!checkinDate || !checkoutDate}
              >
                Continuar → Tus datos
              </button>
            </>
          )}

          {/* PASO 1: DATOS */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 32 }}>
                Tus datos
              </div>
              <label className="form-label">Nombre completo</label>
              <input
                className="form-input"
                placeholder="María García López"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
              <label className="form-label">Email</label>
              <input
                className="form-input"
                placeholder="maria@ejemplo.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
              <label className="form-label">Teléfono</label>
              <input
                className="form-input"
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
                Cancelación gratuita hasta 14 días antes de la llegada.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-outline"
                  style={{ flex: 1, padding: 14, fontSize: 12 }}
                  onClick={() => setStep(0)}
                >
                  ← Atrás
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: 14, fontSize: 13, letterSpacing: '0.1em' }}
                  onClick={() => setStep(2)}
                >
                  Continuar → Extras
                </button>
              </div>
            </>
          )}

          {/* PASO 2: EXTRAS */}
          {step === 2 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 8 }}>
                Extras opcionales
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                Selecciona los servicios adicionales que quieres incluir en tu estancia.
              </div>

              {activeExtras.length === 0 ? (
                <div style={{ fontSize: 13, color: '#64748b', padding: '20px 0' }}>
                  No hay extras disponibles en este momento.
                </div>
              ) : (
                <div className="extras-list">
                  {activeExtras.map(extra => {
                    const isSelected = selectedExtras.includes(extra.id);
                    return (
                      <div
                        key={extra.id}
                        className={`extra-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleExtra(extra.id)}
                      >
                        <div className="extra-item-info">
                          <div className="extra-item-name">{extra.name}</div>
                          <div className="extra-item-desc">{extra.description}</div>
                        </div>
                        <div className="extra-item-right">
                          <span className={`extra-item-price ${extra.price === 0 ? 'free' : ''}`}>
                            {extra.price === 0 ? 'Gratis' : `${extra.price} €`}
                          </span>
                          <div className={`extra-check ${isSelected ? 'checked' : ''}`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-outline"
                  style={{ flex: 1, padding: 14, fontSize: 12 }}
                  onClick={() => setStep(1)}
                >
                  ← Atrás
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: 14, fontSize: 13, letterSpacing: '0.1em' }}
                  onClick={() => setStep(3)}
                >
                  Continuar → Pagar depósito ({deposit} €)
                </button>
              </div>
            </>
          )}

          {/* PASO 3: PAGO */}
          {step === 3 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 8 }}>
                Pago seguro
              </div>
              <div style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico d={paths.lock} size={13} color="#8a8a8a" />
                Procesado por Stripe · PCI DSS Level 1
              </div>

              {/* Información de pago */}
              <div style={{ background: '#e8e8e8', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
                  💳 Depósito del 50%
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a5f6e' }}>
                  {deposit} €
                </div>
                <div style={{ fontSize: 11, color: '#6a6a6a', marginTop: 8 }}>
                  50% restante en efectivo al llegar
                </div>
              </div>

              {/* CardElement de Stripe */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 8, display: 'block' }}>
                  Datos de tarjeta
                </label>
                <div style={{ border: '1px solid rgba(58,58,58,0.15)', padding: 14, borderRadius: 4, background: '#f5f5f5' }}>
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        fontFamily: 'Jost, sans-serif',
                        color: '#0f172a',
                        '::placeholder': { color: '#b0b0b0' },
                      },
                      invalid: { color: '#dc3545' },
                    },
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#8a8a8a', marginTop: 8, lineHeight: 1.4 }}>
                  <strong>Prueba:</strong> 4242 4242 4242 4242, fecha futura (ej: 12/27), CVC aleatorio (ej: 123)
                </div>
              </div>

              {stripeError && (
                <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: '#c00' }}>
                  {stripeError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-outline"
                  style={{ flex: 1, padding: 14, fontSize: 12 }}
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  ← Atrás
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: 14, fontSize: 13, letterSpacing: '0.1em', background: '#1a5f6e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handlePayment}
                  disabled={loading || !stripe || !elements}
                >
                  {loading ? '⏳ Procesando...' : `Pagar ${deposit} €`}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#b0b0b0', textAlign: 'center', marginTop: 16 }}>
                Tus datos de tarjeta nunca tocan nuestros servidores
              </div>
            </>
          )}

          {/* PASO 4: CONFIRMADO */}
          {step === 4 && (
            <div className="confirm-success">
              <div className="confirm-icon">
                <Ico d={paths.check} size={32} color="#ffffff" />
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: '#0f172a', marginBottom: 12 }}>
                ¡Reserva confirmada!
              </div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>
                Hemos enviado la confirmación a tu email. Recuerda traer{' '}
                <strong>{deposit} €</strong> en efectivo para el día de tu llegada.
              </p>
              <button className="btn-outline" style={{ width: '100%' }} onClick={onClose}>
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
