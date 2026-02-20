import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { useLang } from '../contexts/LangContext';
import { fetchApartments, submitContactMessage } from '../services/supabaseService';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', apt: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [apartmentsList, setApartmentsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApartments().then(setApartmentsList);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage(form);
      setSent(true);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      alert('Hubo un error al enviar tu mensaje. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const up = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const { t } = useLang();

  return (
    <>
      <SEO
        title={t('Contacto', 'Contact')}
        description={t('¿Tienes alguna duda? Contacta con nosotros. Estamos aquí para ayudarte a planificar tu estancia en Ribadeo.', 'Any questions? Contact us. We are here to help you plan your stay in Ribadeo.')}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="page-hero">
        <div className="page-hero-eyebrow">Estamos aquí</div>
        <h1 className="page-hero-title">
          Escríbenos,<br /><em>respondemos rápido</em>
        </h1>
        <p className="page-hero-desc">
          Cualquier duda sobre disponibilidad, precios, accesibilidad o servicios. Respondemos en menos de 24 horas, normalmente en pocas horas.
        </p>
      </div>

      {/* FORMULARIO + INFO */}
      <div className="contact-grid">
        {/* FORMULARIO */}
        <div className="contact-form-side">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 64, height: 64, background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Ico d={paths.check} size={28} color="#1a5f6e" />
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: '#0f172a', marginBottom: 12 }}>
                ¡Mensaje enviado!
              </div>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>
                Hemos recibido tu mensaje y te responderemos en breve a <strong>{form.email}</strong>.
              </p>
              <button
                className="btn-outline"
                onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', apt: '', msg: '' }); }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <>
              <div className="contact-form-title">Envíanos un mensaje</div>
              <div className="contact-form-sub">
                También puedes llamarnos directamente. Somos personas reales.
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-row" style={{ marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input
                      className="form-input"
                      placeholder="Tu nombre"
                      value={form.name}
                      onChange={up('name')}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={up('email')}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Teléfono</label>
                    <input
                      className="form-input"
                      placeholder="+34 600 000 000"
                      value={form.phone}
                      onChange={up('phone')}
                    />
                  </div>
                  <div>
                    <label className="form-label">Apartamento de interés</label>
                    <select className="form-input" value={form.apt} onChange={up('apt')} style={{ cursor: 'pointer' }}>
                      <option value="">-- Sin preferencia --</option>
                      {apartmentsList.map(a => (
                        <option key={a.slug} value={a.slug}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="form-label">Mensaje *</label>
                <textarea
                  className="form-input"
                  placeholder="Cuéntanos qué necesitas: fechas, número de personas, dudas sobre el apartamento..."
                  rows={5}
                  value={form.msg}
                  onChange={up('msg')}
                  required
                  style={{ resize: 'vertical' }}
                />

                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                  Al enviar este formulario aceptas nuestra{' '}
                  <a href="/privacidad" style={{ color: '#1a5f6e', textDecoration: 'underline' }}>política de privacidad</a>.
                  Tus datos no se compartirán con terceros.
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 13 }} disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar mensaje →'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* INFO */}
        <div className="contact-info-side">
          <div className="contact-info-title">Información de contacto</div>

          <div className="contact-info-item">
            <Ico d={paths.phone} size={18} color="#7dd3fc" />
            <div>
              <div className="contact-info-label">Teléfono</div>
              <div className="contact-info-value">+34 982 XXX XXX</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Lun–Dom · 9:00 – 21:00
              </div>
            </div>
          </div>

          <div className="contact-info-item">
            <Ico d={paths.mail} size={18} color="#7dd3fc" />
            <div>
              <div className="contact-info-label">Email</div>
              <div className="contact-info-value">info@illapancha.com</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Respuesta en &lt; 24h
              </div>
            </div>
          </div>

          <div className="contact-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <div>
              <div className="contact-info-label">WhatsApp</div>
              <a
                href="https://wa.me/34982XXXXXX?text=Hola%2C%20me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20los%20apartamentos%20en%20Ribadeo."
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-value"
                style={{ color: '#25D366', display: 'block' }}
              >
                +34 982 XXX XXX
              </a>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Respuesta inmediata
              </div>
            </div>
          </div>

          <div className="contact-info-item">
            <Ico d={paths.map} size={18} color="#7dd3fc" />
            <div>
              <div className="contact-info-label">Dirección</div>
              <div className="contact-info-value">
                Ribadeo, Lugo<br />Galicia, España
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40, padding: '24px', background: 'rgba(168,197,160,0.12)' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#ffffff', marginBottom: 8 }}>
              Check-in y check-out
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Entrada</span>
              <span>A partir de las 15:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Salida</span>
              <span>Antes de las 11:00</span>
            </div>
          </div>

          <div className="map-placeholder">
            <div style={{ textAlign: 'center' }}>
              <Ico d={paths.map} size={40} color="rgba(255,255,255,0.15)" />
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                Ribadeo, Galicia · 43.5350° N, 7.0412° W
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
