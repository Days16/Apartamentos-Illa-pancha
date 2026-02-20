import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { fetchApartments, fetchWebsiteContent } from '../services/supabaseService';

const reviews = [
  { text: "El apartamento estaba impecable y las vistas a la ría son increíbles. Repetiremos seguro.", author: "María Gómez", date: "Octubre 2025" },
  { text: "Ubicación perfecta para descubrir Ribadeo y Asturias. Todo muy nuevo y cómodo.", author: "David Ruiz", date: "Agosto 2025" },
  { text: "La comunicación fue genial y el check-in automático súper cómodo. Muy recomendable.", author: "Laura F.", date: "Julio 2025" }
];

import { useLang } from '../contexts/LangContext';

export default function Home() {
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const [checkin, setCheckin] = useState('2026-07-12');
  const [checkout, setCheckout] = useState('2026-07-19');
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  const [featuredApts, setFeaturedApts] = useState([]);
  const [texts, setTexts] = useState({});

  useEffect(() => {
    fetchApartments().then(data => setFeaturedApts(data.slice(0, 5)));
    fetchWebsiteContent('home').then(data => {
      const cmap = {};
      data.forEach(item => cmap[item.section_key] = item);
      setTexts(cmap);
    });
  }, []);

  const getText = (key, defaultEs, defaultEn) => {
    if (!texts[key]) return t(defaultEs, defaultEn);
    return t(texts[key].content_es, texts[key].content_en);
  };


  const handleSearch = () => {
    setSearched(true);
    document.getElementById('apartments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBook = (apt) => {
    setSelectedApt(apt);
    setBookingOpen(true);
  };

  return (
    <>
      <SEO
        title={t('Inicio', 'Home')}
        description={t('Reserva tu estancia en Illa Pancha, apartamentos turísticos de lujo en Ribadeo con vistas al mar.', 'Book your stay at Illa Pancha, luxury tourist apartments in Ribadeo with sea views.')}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-noise" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-eyebrow">Ribadeo, Galicia</div>
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: getText('home_hero_title', 'Alquila<br /><em>directo,</em><br />sin comisiones', 'Book<br /><em>direct,</em><br />no commissions') }} />
          <p className="hero-desc">
            {getText('home_hero_desc', 'Ocho apartamentos junto a la ría del Eo. Reserva con nosotros y paga menos que en cualquier plataforma.', 'Eight apartments by the Eo estuary. Book with us and pay less than on any platform.')}
          </p>
          <div className="hero-actions">
            <button className="btn-dark" onClick={handleSearch}>
              {t('Ver disponibilidad', 'Check availability')}
            </button>
            <button className="btn-dark-ghost" onClick={() => navigate('/apartamentos')}>
              {t('Conocer los apartamentos', 'Meet the apartments')}
            </button>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="search-bar">
          <div className="search-inner">
            <div className="search-field">
              <div className="search-label">{t('Llegada', 'Check-in')}</div>
              <input
                type="date"
                value={checkin}
                onChange={e => setCheckin(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-field">
              <div className="search-label">{t('Salida', 'Check-out')}</div>
              <input
                type="date"
                value={checkout}
                onChange={e => setCheckout(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-field" style={{ flex: '0.6' }}>
              <div className="search-label">{t('Huéspedes', 'Guests')}</div>
              <select
                value={guests}
                onChange={e => setGuests(+e.target.value)}
                className="search-input"
                style={{ cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>
            <button className="search-btn" onClick={handleSearch}>
              {t('Buscar apartamentos →', 'Search apartments →')}
            </button>
          </div>
        </div>
      </div>

      {/* CARACTERÍSTICAS */}
      <div className="features">
        {[
          { icon: paths.cash, t: getText('home_features_1_title', 'Sin comisiones', 'No commissions'), d: getText('home_features_1_desc', 'Reserva directa. Lo que pagas es lo que recibimos nosotros, sin intermediarios ni sorpresas.', 'Direct booking. What you pay is what we receive, no middlemen or surprises.') },
          { icon: paths.lock, t: getText('home_features_2_title', 'Pago seguro', 'Secure payment'), d: getText('home_features_2_desc', '50% ahora con tarjeta como depósito. El resto en efectivo cuando llegues al apartamento.', '50% now by card as deposit. The rest in cash upon arrival.') },
          { icon: paths.sync, t: getText('home_features_3_title', 'Siempre actualizado', 'Always updated'), d: getText('home_features_3_desc', 'Nuestro calendario se sincroniza con Booking y Airbnb en tiempo real. Nunca habrá doble reserva.', 'Our calendar syncs with Booking and Airbnb in real-time. Double bookings will never happen.') },
          { icon: paths.map, t: getText('home_features_4_title', 'Ribadeo, Galicia', 'Ribadeo, Galicia'), d: getText('home_features_4_desc', 'A 5 minutos del puente internacional y de las mejores playas de la costa norte gallega.', '5 minutes from the international bridge and the best beaches on the northern Galician coast.') },
        ].map((f, i) => (
          <div key={i} className="feature">
            <div className="feature-icon">
              <Ico d={f.icon} size={28} color="#7dd3fc" />
            </div>
            <div className="feature-title">{f.t}</div>
            <div className="feature-desc">{f.d}</div>
          </div>
        ))}
      </div>

      {/* APARTAMENTOS */}
      <div className="section" id="apartments-section">
        <div className="section-eyebrow">{t('Nuestros apartamentos', 'Our apartments')}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="section-title" style={{ marginBottom: 0 }} dangerouslySetInnerHTML={{ __html: t('Ocho espacios<br /><em>para descansar</em>', 'Eight spaces<br /><em>to rest</em>') }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {searched && (
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 300, alignSelf: 'flex-end' }}>
                Disponibilidad · {checkin} → {checkout}
              </div>
            )}
            <button
              className="btn-outline"
              onClick={() => navigate('/apartamentos')}
              style={{ alignSelf: 'flex-end' }}
            >
              {t('Ver todos', 'View all')}
            </button>
          </div>
        </div>

        <div className="apts-grid" style={{ marginTop: 48 }}>
          {featuredApts
            .filter(a => !searched || a.active)
            .map((apt, i) => (
              <div
                key={apt.slug}
                className="apt-card"
                onClick={() => navigate(`/apartamentos/${apt.slug}`)}
              >
                <div
                  className="apt-img"
                  style={{
                    background: apt.gradient,
                    height: i === 0 ? '100%' : 240,
                    position: i === 0 ? 'absolute' : 'relative',
                    inset: i === 0 ? 0 : 'auto',
                  }}
                >
                  <Ico d={paths.photo} size={40} color="rgba(255,255,255,0.12)" />
                </div>
                {i === 0 && <div style={{ paddingTop: '100%' }} />}
                <div className="apt-tag">{apt.tagline}</div>
                <div className="apt-overlay" />
                <div className="apt-info">
                  <div className="apt-name">{apt.name}</div>
                  <div className="apt-meta">
                    <span>{apt.capacity} pers · {apt.beds} dorm</span>
                    <span className="apt-price">
                      {apt.price} €
                      <span style={{ fontSize: 12, color: 'rgba(168,197,160,0.7)' }}>/{t('noche', 'night')}</span>
                    </span>
                  </div>
                </div>
                <div className="apt-rating">
                  ★ {apt.rating}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* RESEÑAS */}
      <div style={{ padding: '0 80px 100px' }}>
        <div className="section-eyebrow">Lo que dicen nuestros huéspedes</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 0 }}>
          <div className="section-title">
            Opiniones<br /><em>reales</em>
          </div>
          <div style={{ fontSize: 13, color: '#475569', fontWeight: 300, paddingBottom: 8 }}>
            4.9 ★ · +220 opiniones verificadas
          </div>
        </div>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-stars">{'★'.repeat(r.stars)}</div>
              <div className="review-text">"{r.text}"</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="review-author">{r.name} · {r.origin}</div>
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>{r.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BANNER RESERVA DIRECTA */}
      <div style={{ background: '#1a5f6e', padding: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: getText('home_banner_title', '¿Por qué reservar<br /><em>directo con nosotros?</em>', 'Why book<br /><em>direct with us?</em>') }} />
          <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: 500 }}>
            {getText('home_banner_desc', 'Ahorra entre un 15 y un 20% respecto a Booking.com o Airbnb. El mismo apartamento, el mismo servicio, sin comisiones de intermediarios.', 'Save between 15% and 20% compared to Booking.com or Airbnb. Same apartment, same service, no commissions.')}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            className="btn-dark"
            style={{ marginBottom: 12, display: 'block' }}
            onClick={() => setBookingOpen(true)}
          >
            {t('Reservar ahora sin comisión', 'Book now no commission')}
          </button>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            {t('Cancelación gratuita · 14 días antes', 'Free cancellation · 14 days before')}
          </div>
        </div>
      </div>

      <Footer />

      {bookingOpen && (
        <BookingModal
          apartment={selectedApt}
          onClose={() => { setBookingOpen(false); setSelectedApt(null); }}
        />
      )}
    </>
  );
}
