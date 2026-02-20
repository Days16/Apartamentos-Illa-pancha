import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { fetchApartments, fetchWebsiteContent } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { formatDateShort, formatPrice } from '../utils/format';

// Convierte "2026-07-12" en número de día del mes (12)
function dayOfMonth(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').getDate();
}

// Comprueba si el rango [checkin, checkout] solapa con los días ocupados del apartamento
// occupiedDays son números de día del mes (simplificado para la demo con mockData)
function isAvailableForDates(apt, checkin, checkout) {
  if (!checkin || !checkout) return true;
  const startDay = dayOfMonth(checkin);
  const endDay = dayOfMonth(checkout);
  if (!startDay || !endDay || endDay <= startDay) return true;
  for (let d = startDay; d < endDay; d++) {
    if (apt.occupiedDays.includes(d)) return false;
  }
  return true;
}

export default function Apartments() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const T = useT(lang);
  const A = T.apartments;

  const [apartments, setApartments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  // Cargar apartamentos desde Supabase
  useEffect(() => {
    fetchApartments().then(setApartments).catch(err => {
      console.error('Error loading apartments:', err);
      setApartments([]);
    });
  }, []);

  const FILTERS = [
    { id: 'all', label: A.filters.all },
    { id: '2', label: A.filters.f2 },
    { id: '4', label: A.filters.f4 },
    { id: '6', label: A.filters.f6 },
    { id: 'sea', label: A.filters.sea },
  ];

  const handleSearch = () => {
    setSearched(true);
  };

  const filtered = apartments.filter(apt => {
    if (!apt.active) return true; // siempre mostrar, pero marcado como no disponible
    const capacity = apt.capacity || apt.cap || 2;
    const amenities = apt.amenities || [];
    if (filter === '2') return capacity <= 2;
    if (filter === '4') return capacity <= 4;
    if (filter === '6') return capacity <= 6;
    if (filter === 'sea') return amenities.some(a => typeof a === 'string' && a.includes('Vistas'));
    // Filtro por capacidad de huéspedes si se buscó
    if (searched && guests > 0) return capacity >= guests;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  const getAvailStatus = (apt) => {
    if (!apt.active) return 'inactive';
    if (!searched || !checkin || !checkout) return 'unknown';
    return isAvailableForDates(apt, checkin, checkout) ? 'available' : 'occupied';
  };

  const availableCount = searched && checkin && checkout
    ? filtered.filter(apt => getAvailStatus(apt) === 'available').length
    : filtered.length;

  return (
    <>
      <SEO
        title={T.nav.apartments}
        description={T.seo.aptsDesc}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="apts-list-hero" style={{ paddingTop: 140 }}>
        <div className="section-eyebrow">{A.eyebrow}</div>
        <div className="section-title">
          {A.title}<br /><em>{A.titleEm}</em>
        </div>
        <p className="section-desc">{A.desc}</p>

        {/* BUSCADOR DE DISPONIBILIDAD */}
        <div className="avail-search-bar">
          <div className="avail-search-field">
            <div className="avail-search-label">
              <Ico d={paths.cal} size={12} color="#64748b" />
              {A.checkin}
            </div>
            <input
              type="date"
              value={checkin}
              min={today}
              onChange={e => { setCheckin(e.target.value); setSearched(false); }}
              className="avail-search-input"
            />
            {checkin && <div className="avail-search-date-es">{formatDateShort(checkin)}</div>}
          </div>

          <div className="avail-search-divider" />

          <div className="avail-search-field">
            <div className="avail-search-label">
              <Ico d={paths.cal} size={12} color="#64748b" />
              {A.checkout}
            </div>
            <input
              type="date"
              value={checkout}
              min={checkin || today}
              onChange={e => { setCheckout(e.target.value); setSearched(false); }}
              className="avail-search-input"
            />
            {checkout && <div className="avail-search-date-es">{formatDateShort(checkout)}</div>}
          </div>

          <div className="avail-search-divider" />

          <div className="avail-search-field avail-search-field-sm">
            <div className="avail-search-label">
              <Ico d={paths.users} size={12} color="#64748b" />
              {A.guests}
            </div>
            <select
              value={guests}
              onChange={e => { setGuests(+e.target.value); setSearched(false); }}
              className="avail-search-input"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? T.common.person : A.persons}</option>
              ))}
            </select>
          </div>

          <button
            className="avail-search-btn"
            onClick={handleSearch}
          >
            <Ico d={paths.check} size={14} color="#ffffff" />
            {A.search}
          </button>
        </div>

        {searched && checkin && checkout && (
          <div className="avail-search-result">
            {A.searchResult
              .replace('{count}', availableCount)
              .replace('{s}', availableCount !== 1 ? (lang === 'ES' ? 's' : 's') : '')
              .replace('{start}', formatDateShort(checkin))
              .replace('{end}', formatDateShort(checkout))
              .replace('{guests}', guests)
              .replace('{persons}', guests === 1 ? T.common.person : A.persons)
            }
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div className="apt-list-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`apt-filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
          {A.countApts
            .replace('{count}', filtered.length)
            .replace('{s}', filtered.length !== 1 ? 's' : '')}
        </span>
      </div>

      {/* GRID */}
      <div className="apts-list-grid">
        {filtered.map(apt => {
          const status = getAvailStatus(apt);
          return (
            <div
              key={apt.slug}
              className={`apt-list-card ${status === 'occupied' ? 'apt-occupied' : ''}`}
              onClick={() => navigate(`/apartamentos/${apt.slug}`)}
            >
              <div className="apt-list-img" style={{ background: apt.gradient, height: 280 }}>
                <Ico d={paths.photo} size={36} color="rgba(255,255,255,0.12)" />
              </div>
              <div className="apt-list-overlay" />

              {/* Tags de disponibilidad */}
              <div className="apt-list-tag">
                {lang === 'EN' ? (apt.taglineEn || apt.tagline) : apt.tagline}
              </div>

              {status === 'available' && (
                <div className="apt-avail-badge apt-avail-yes">✓ {A.available}</div>
              )}
              {status === 'occupied' && (
                <div className="apt-avail-badge apt-avail-no">✗ {A.occupied}</div>
              )}
              {!apt.active && (
                <div className="apt-list-unavail">{A.unavailable}</div>
              )}

              <div className="apt-list-info">
                <div className="apt-list-name">
                  {lang === 'EN' ? (apt.nameEn || apt.name) : apt.name}
                </div>
                <div className="apt-list-meta">
                  <span>{apt.cap} {A.persons}</span>
                  <span>{apt.beds} {apt.beds > 1 ? A.beds : A.bed}</span>
                  <span>{apt.baths} {apt.baths > 1 ? A.baths : A.bath}</span>
                  <span>{A.minStay} {apt.minStay} {A.nights}</span>
                </div>
                <div className="apt-list-bottom">
                  <div className="apt-list-price">
                    {formatPrice(apt.price)}
                    <span style={{ fontSize: 13, color: 'rgba(168,197,160,0.7)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}> {A.perNight}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ★ {apt.rating} <span style={{ opacity: 0.5 }}>({apt.reviewCount})</span>
                  </div>
                </div>

                {/* Botón reservar directo si hay disponibilidad y fechas */}
                {status === 'available' && (
                  <button
                    className="apt-book-direct-btn"
                    onClick={e => { e.stopPropagation(); setSelectedApt(apt); setBookingOpen(true); }}
                  >
                    {A.bookNow}
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
