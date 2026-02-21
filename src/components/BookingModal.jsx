import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Ico, { paths } from './Ico';
import { supabase } from '../lib/supabase';
import { createPaymentIntent, confirmPayment } from '../lib/stripe';
import { sendBookingConfirmation } from '../services/resendService';
import { fetchExtras, fetchSettings } from '../services/supabaseService';
import { useDiscount } from '../contexts/DiscountContext';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { formatPrice } from '../utils/format';

export default function BookingModal({ onClose, apartment }) {
  const { lang, t } = useLang();
  const T = useT(lang);
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [checkinDate, setCheckinDate] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [confirmedId, setConfirmedId] = useState('');
  const [allExtras, setAllExtras] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({});

  // Cargar extras desde Supabase
  useEffect(() => {
    Promise.all([
      fetchExtras(),
      fetchSettings()
    ]).then(([extras, settings]) => {
      setAllExtras(extras);
      setGlobalSettings(settings);
    }).catch(err => {
      console.error('Error loading booking data:', err);
    });
  }, []);

  const steps = T.booking.steps;

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

  // Preferencias globales > Apt > Default
  // Apt > Global > Default
  const cancelDays = apt.cancellation_days ?? globalSettings.cancellation_days ?? 14;
  const depositPct = apt.deposit_percentage ?? globalSettings.payment_deposit_percentage ?? 50;

  const deposit = Math.round(total * (depositPct / 100));

  // Formatear fechas para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(lang === 'ES' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
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
      setStripeError(T.booking.errorDates);
      return;
    }

    if (!form.name || !form.email || !form.phone) {
      setStripeError(T.booking.errorData);
      return;
    }

    if (!stripe || !elements) {
      setStripeError(T.booking.errorStripe);
      return;
    }

    setLoading(true);
    setStripeError('');

    try {
      // Crear ID de reserva (criptográficamente seguro)
      const reservationId = 'IP-' + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);

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

      setConfirmedId(reservationId);
      setStep(4);
    } catch (err) {
      setStripeError(err.message || T.booking.errorPayment);
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
            {T.booking[`title${step}`]}
          </div>
          <div className="booking-sub">
            {step < 4
              ? `${apt.name} · ${checkin} – ${checkout} · 2 ${T.booking.guests}`
              : T.booking.emailSent}
          </div>

          {step < 4 && (
            <>
              <div className="booking-summary-row">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{nights} {nights === 1 ? T.common.night : T.common.nights} × {formatPrice(apt.price)}</span>
                <span style={{ textDecoration: discountAmount > 0 ? 'line-through' : 'none', opacity: discountAmount > 0 ? 0.6 : 1 }}>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="booking-summary-row" style={{ color: '#4CAF50', marginTop: -8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12 }}>{T.common.offerApplied}: {activeDiscount.discount_code || 'Promo'} (-{activeDiscount.discount_percentage}%)</span>
                  <span style={{ fontWeight: 600 }}>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="booking-summary-row">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{T.booking.cleaning}</span>
                <span>{formatPrice(cleaningFee)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="booking-summary-row">
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>{T.booking.extrasLabel} ({selectedExtras.length})</span>
                  <span>{formatPrice(extrasTotal)}</span>
                </div>
              )}
              <div className="booking-summary-row" style={{ borderBottom: 'none' }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18 }}>Total</span>
                <strong style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>{formatPrice(total)}</strong>
              </div>
              <div className="booking-highlight">
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 12 }}>
                  {T.booking.payModel}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>💳 {T.booking.cardNow} ({depositPct}%)</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(deposit)}</span>
                </div>
                {depositPct < 100 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>💵 {T.booking.cashArrival} ({100 - depositPct}%)</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(total - deposit)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <div style={{ marginTop: 24 }}>
              {[
                [T.booking.ref, confirmedId],
                [T.booking.apartment, apt.name],
                [T.booking.checkin, checkin],
                [T.booking.checkout, checkout],
                [T.booking.deposited, `${deposit} € ✓`],
                ...(depositPct < 100 ? [[T.booking.cashRest, `${total - deposit} €`]] : []),
                ...(selectedExtras.length > 0 ? [[T.booking.extrasLabel, `${selectedExtras.length} ${selectedExtras.length > 1 ? T.booking.extrasSelected : T.booking.extraSelected}`]] : []),
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
                {T.booking.title0}
              </div>
              <label className="form-label">{T.booking.checkin}</label>
              <DatePicker
                selected={checkinDate}
                onChange={date => setCheckinDate(date)}
                minDate={new Date()}
                maxDate={checkoutDate ? new Date(checkoutDate.getTime() - 86400000) : null}
                dateFormat={lang === 'ES' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'}
                className="form-input"
                placeholderText={T.booking.placeholderCheckin}
              />
              <label className="form-label" style={{ marginTop: 16 }}>{T.booking.checkout}</label>
              <DatePicker
                selected={checkoutDate}
                onChange={date => setCheckoutDate(date)}
                minDate={checkinDate ? new Date(checkinDate.getTime() + 86400000) : new Date()}
                dateFormat={lang === 'ES' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'}
                className="form-input"
                placeholderText={T.booking.placeholderCheckout}
              />
              {nights > 0 && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  📅 {nights} {nights === 1 ? T.common.night : T.common.nights} × {apt.price}€/{T.common.night} = {subtotal}€
                </div>
              )}
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginTop: 28, marginBottom: 28 }}>
                {T.booking.termsText}{' '}
                <a href="/terminos" target="_blank" style={{ color: '#1a5f6e', textDecoration: 'underline' }}>{T.booking.terms}</a> {T.booking.termsAnd}{' '}
                <a href="/privacidad" target="_blank" style={{ color: '#1a5f6e', textDecoration: 'underline' }}>{T.booking.privacy}</a>.<br />
                {T.booking.cancelFree.replace('{days}', cancelDays)}
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: 16, fontSize: 13, letterSpacing: '0.12em' }}
                onClick={() => setStep(1)}
                disabled={!checkinDate || !checkoutDate}
              >
                {T.booking.continueData}
              </button>
            </>
          )}

          {/* PASO 1: DATOS */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 32 }}>
                {T.booking.title1}
              </div>
              <label className="form-label">{T.booking.fullName}</label>
              <input
                className="form-input"
                placeholder={T.booking.placeholderName}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={{ borderColor: step === 1 && !form.name.trim() ? '#f44' : 'rgba(15,23,42,0.15)' }}
              />
              <label className="form-label">{T.booking.email}</label>
              <input
                className="form-input"
                placeholder={T.booking.placeholderEmail}
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={{ borderColor: step === 1 && !form.email.includes('@') ? '#f44' : 'rgba(15,23,42,0.15)' }}
              />
              <label className="form-label">{T.booking.phone}</label>
              <input
                className="form-input"
                placeholder={T.booking.placeholderPhone}
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                style={{ borderColor: step === 1 && !form.phone.trim() ? '#f44' : 'rgba(15,23,42,0.15)' }}
              />
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
                {T.booking.cancelFree.replace('{days}', cancelDays)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-outline"
                  style={{ flex: 1, padding: 14, fontSize: 12 }}
                  onClick={() => setStep(0)}
                >
                  {T.booking.back}
                </button>
                <button
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: 14,
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    opacity: (!form.name.trim() || !form.email.includes('@') || !form.phone.trim()) ? 0.5 : 1,
                    cursor: (!form.name.trim() || !form.email.includes('@') || !form.phone.trim()) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => setStep(2)}
                  disabled={!form.name.trim() || !form.email.includes('@') || !form.phone.trim()}
                >
                  {T.booking.continueExtras}
                </button>
              </div>
            </>
          )}

          {/* PASO 2: EXTRAS */}
          {step === 2 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 8 }}>
                {T.booking.optionalExtras}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                {T.booking.extrasDesc}
              </div>

              {activeExtras.length === 0 ? (
                <div style={{ fontSize: 13, color: '#64748b', padding: '20px 0' }}>
                  {T.booking.noExtras}
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
                            {extra.price === 0 ? T.booking.free : `${extra.price} €`}
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
                  {T.booking.back}
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: 14, fontSize: 13, letterSpacing: '0.1em' }}
                  onClick={() => setStep(3)}
                >
                  {T.booking.continuePayment} ({deposit} €)
                </button>
              </div>
            </>
          )}

          {/* PASO 3: PAGO */}
          {step === 3 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#0f172a', marginBottom: 8 }}>
                {T.booking.title3}
              </div>
              <div style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico d={paths.lock} size={13} color="#8a8a8a" />
                {T.booking.secureProcessed}
              </div>

              {/* Información de pago */}
              <div style={{ background: '#e8e8e8', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
                  💳 {T.booking.cardNow} del {depositPct}%
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a5f6e' }}>
                  {deposit} €
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                  {depositPct < 100 ? `${100 - depositPct}% ${T.booking.cashRest}` : T.booking.paidFull}
                </div>
              </div>

              {/* CardElement de Stripe */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8a8a', marginBottom: 8, display: 'block' }}>
                  {T.booking.cardData}
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
                  {T.booking.testCard}
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
                  {T.booking.back}
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: 14, fontSize: 13, letterSpacing: '0.1em', background: '#1a5f6e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handlePayment}
                  disabled={loading || !stripe || !elements}
                >
                  {loading ? T.booking.processing : `${T.booking.payConfirm} ${deposit} €`}
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
                {T.booking.bookingConfirmed}
              </div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>
                {T.booking.confirmText}{' '}
                <strong>{total - deposit} €</strong> {T.booking.confirmCash}
              </p>
              <button className="btn-outline" style={{ width: '100%' }} onClick={onClose}>
                {T.booking.backHome}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
