import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { DbApartment } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import Turnstile from '../components/Turnstile';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { useSettings } from '../contexts/SettingsContext';
import { fetchApartments } from '../services/supabaseService';
import { sendOwnerNotification } from '../services/resendService';
import { safeHtml } from '../utils/sanitize';
import { supabase } from '../lib/supabase';
import { siteUrl, mapsUrl, mapsEmbedUrl } from '../constants/assets';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', apt: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [apartmentsList, setApartmentsList] = useState<DbApartment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    fetchApartments().then(setApartmentsList);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) {
      alert('Por favor completa la verificación de seguridad.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-contact', {
        body: { ...form, turnstileToken: captchaToken },
      });
      if (error) throw error;
      setSent(true);
      // Notify owner (silent, non-blocking)
      sendOwnerNotification({
        type: 'contact',
        guestName: form.name,
        guestEmail: form.email,
        guestPhone: form.phone,
        subject: form.apt ? `Consulta sobre ${form.apt}` : 'Consulta general',
        message: form.msg,
      });
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      alert('Hubo un error al enviar tu mensaje. Inténtalo de nuevo.');
      setCaptchaToken(''); // resetear para que el widget se renueve
    } finally {
      setSubmitting(false);
    }
  };

  const up = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [field]: e.target.value }));

  const { lang } = useLang();
  const T = useT(lang);
  const C = T.contact;
  const { settings } = useSettings();
  const sitePhone = (settings?.site_phone as string) || '';
  const waPhone = sitePhone.replace(/\D/g, '');
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: 'Illa Pancha',
    url: siteUrl,
    telephone: settings?.contact_phone || '+34 614 52 30 77',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings?.property_address || 'Av. Rosalía de Castro 25',
      addressLocality: 'Ribadeo',
      addressRegion: 'Galicia',
      postalCode: '27700',
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.5354,
      longitude: -7.0415,
    },
    openingHours: 'Mo-Su 09:00-21:00',
    priceRange: '€€',
  };

  return (
    <>
      <SEO title={C.title} description={C.desc} jsonLd={localBusinessJsonLd} />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="contact-hero">
        <div className="contact-hero-inner">
          <span className="contact-hero-eyebrow">{C.heroEyebrow}</span>
          <h1 className="contact-hero-title" dangerouslySetInnerHTML={safeHtml(C.heroTitle)} />
          <p className="contact-hero-desc">{C.heroDesc}</p>
          <div className="contact-hero-chips">
            <span className="contact-hero-chip">📞 {C.hours}</span>
            <span className="contact-hero-chip">✉️ {C.response}</span>
            <span className="contact-hero-chip">💬 {C.immediateResponse}</span>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div className="contact-body">

        {/* COLUMNA FORMULARIO */}
        <div className="contact-form-col">
          <div className="contact-form-card">
            {sent ? (
              <div className="contact-sent">
                <div className="contact-sent-icon">
                  <Ico d={paths.check} size={30} color="#1a5f6e" />
                </div>
                <h2 className="contact-sent-title">{C.sentTitle}</h2>
                <p className="contact-sent-desc">
                  {C.sentDesc.split('{email}')[0]}
                  <strong>{form.email}</strong>
                  {C.sentDesc.split('{email}')[1]}
                </p>
                <button
                  className="contact-sent-btn"
                  onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', apt: '', msg: '' }); }}
                >
                  {C.sendAnother}
                </button>
              </div>
            ) : (
              <>
                <div className="contact-form-header">
                  <h2 className="contact-form-title">{C.formTitle}</h2>
                  <p className="contact-form-sub">{C.formSub}</p>
                </div>
                <form onSubmit={handleSubmit} className="contact-form-fields">
                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label htmlFor="contact-name" className="contact-label">{C.labelName}</label>
                      <input id="contact-name" className="contact-input" placeholder={C.placeholderName} value={form.name} onChange={up('name')} maxLength={100} required />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="contact-email" className="contact-label">{C.labelEmail}</label>
                      <input id="contact-email" type="email" className="contact-input" placeholder={C.placeholderEmail} value={form.email} onChange={up('email')} maxLength={254} required />
                    </div>
                  </div>
                  <div className="contact-field-row">
                    <div className="contact-field">
                      <label htmlFor="contact-phone" className="contact-label">{C.labelPhone}</label>
                      <input id="contact-phone" type="tel" className="contact-input" placeholder={C.placeholderPhone} value={form.phone} onChange={up('phone')} maxLength={20} />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="contact-apt" className="contact-label">{C.labelApt}</label>
                      <select id="contact-apt" className="contact-input contact-select" value={form.apt} onChange={up('apt')} aria-label={C.labelApt}>
                        <option value="">{C.noPref}</option>
                        {apartmentsList.map(a => (
                          <option key={a.slug} value={a.slug}>{lang === 'EN' ? a.name_en || a.name : a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-msg" className="contact-label">{C.labelMsg}</label>
                    <textarea id="contact-msg" className="contact-input contact-textarea" placeholder={C.placeholderMsg} rows={5} maxLength={3000} value={form.msg} onChange={up('msg')} required />
                    <div className="contact-charcount">{form.msg.length} / 3000</div>
                  </div>
                  <p className="contact-privacy">{C.privacy}</p>
                  <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
                  <button type="submit" className="contact-submit" disabled={submitting || !captchaToken}>
                    {submitting ? <><span className="contact-submit-spinner" />{C.submitting}</> : <>{C.sendMsg} →</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* COLUMNA INFO */}
        <div className="contact-info-col">
          <h3 className="contact-info-heading">{C.infoTitle}</h3>

          <div className="contact-cards">
            <a href={`tel:${sitePhone.replace(/\s/g, '')}`} className="contact-card">
              <div className="contact-card-icon contact-card-icon--teal"><Ico d={paths.phone} size={18} color="#fff" /></div>
              <div className="contact-card-body">
                <span className="contact-card-label">{T.booking.phone}</span>
                <span className="contact-card-value">{sitePhone || '+34 982 XXX XXX'}</span>
                <span className="contact-card-hint">{C.hours}</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

            <a href="mailto:info@apartamentosillapancha.com" className="contact-card">
              <div className="contact-card-icon contact-card-icon--navy"><Ico d={paths.mail} size={18} color="#fff" /></div>
              <div className="contact-card-body">
                <span className="contact-card-label">{T.booking.email}</span>
                <span className="contact-card-value contact-card-value--sm">info@apartamentosillapancha.com</span>
                <span className="contact-card-hint">{C.response}</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

            <a href={waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(C.waMsg)}` : '#'} target="_blank" rel="noopener noreferrer" className="contact-card">
              <div className="contact-card-icon contact-card-icon--wa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </div>
              <div className="contact-card-body">
                <span className="contact-card-label">{C.waLabel}</span>
                <span className="contact-card-value">{sitePhone || '+34 982 XXX XXX'}</span>
                <span className="contact-card-hint">{C.immediateResponse}</span>
              </div>
              <span className="contact-card-arrow">→</span>
            </a>

            <div className="contact-card contact-card--static">
              <div className="contact-card-icon contact-card-icon--gold"><Ico d={paths.map} size={18} color="#fff" /></div>
              <div className="contact-card-body">
                <span className="contact-card-label">{T.detail.location}</span>
                <span className="contact-card-value">{C.address}</span>
                <span className="contact-card-hint">Ribadeo, Galicia · 27700</span>
              </div>
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div className="contact-checkin-card">
            <div className="contact-checkin-title">{C.checkinCheckoutTitle}</div>
            <div className="contact-checkin-row">
              <div className="contact-checkin-item">
                <span className="contact-checkin-label">{T.booking.checkin}</span>
                <span className="contact-checkin-time">{C.checkinTime}</span>
              </div>
              <div className="contact-checkin-divider" />
              <div className="contact-checkin-item">
                <span className="contact-checkin-label">{T.booking.checkout}</span>
                <span className="contact-checkin-time">{C.checkoutTime}</span>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="contact-map-wrap">
            <iframe src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación Illa Pancha Ribadeo" />
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="contact-map-btn">{T.common.openMaps} ↗</a>
          </div>
        </div>
      </div>

      <Footer />
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
