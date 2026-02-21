import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { fetchApartmentBySlug, fetchSettings } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { formatDateShort, MESES, formatPrice, strToDate, dateToStr } from '../utils/format';
import { useDiscount } from '../contexts/DiscountContext';

const amenityIcons = {
  'WiFi': paths.wifi, 'Parking': paths.parking, 'Cocina equipada': paths.kitchen,
  'TV Smart': paths.tv, 'A/C': paths.ac, 'Calefacción': paths.leaf,
  'Lavadora': paths.wash, 'Terraza': paths.leaf, 'Vistas al mar': paths.map,
  'Vistas a la ría': paths.map, 'Cuna disponible': paths.crib, 'Barbacoa': paths.bbq,
};

const amenityTranslations = {
  'Cocina equipada': 'Fully equipped kitchen',
  'Cafetera': 'Coffee maker',
  'Tostadora': 'Toaster',
  'Microondas': 'Microwave',
  'Lavadora': 'Washing machine',
  'Secador de pelo': 'Hair dryer',
  'Plancha': 'Iron',
  'Ropa de cama y toallas': 'Bed linen and towels',
  'Cuna (bajo petición)': 'Crib (on request)',
  'Trona': 'High chair'
};

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function MiniCalendar({ occupiedDays, T }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (day) => {
    if (!day) return false;
    return new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  return (
    <div className="mini-cal">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={() => setMonthOffset(o => o - 1)}
          style={{ background: 'none', border: '1px solid rgba(15,23,42,0.12)', padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#334155' }}
        >‹</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: '#0f172a' }}>
          {MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1)} {year}
        </div>
        <button
          onClick={() => setMonthOffset(o => o + 1)}
          style={{ background: 'none', border: '1px solid rgba(15,23,42,0.12)', padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#334155' }}
        >›</button>
      </div>
      <div className="mini-cal-header">
        {DAY_NAMES.map(d => <div key={d} className="mini-cal-day-name">{d}</div>)}
      </div>
      <div className="mini-cal-grid">
        {cells.map((day, i) => {
          const occ = day && occupiedDays?.includes(day);
          const past = isPast(day);
          return (
            <div
              key={i}
              className={`mini-cal-day ${!day ? 'empty' : past ? 'past' : occ ? 'occupied' : 'available'}`}
              title={day && !past ? (occ ? T.common.occupied : T.common.available) : ''}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <div style={{ width: 10, height: 10, background: '#e0f2fe', border: '1px solid #7dd3fc' }} />
          {T.detail.available}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <div style={{ width: 10, height: 10, background: '#FDE8E8', border: '1px solid #C0392B' }} />
          {T.detail.occupied}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <div style={{ width: 10, height: 10, background: '#F0EDE8', border: '1px solid rgba(15,23,42,0.12)' }} />
          {T.common.past}
        </div>
      </div>
    </div>
  );
}

function BookingWidget({ apt, onBook, T, globalSettings }) {
  const { lang, t } = useLang();
  const { activeDiscount } = useDiscount();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(2);

  // Apt > Global > Default
  const cancelDays = apt.cancellation_days ?? globalSettings.cancellation_days ?? 14;
  const depositPct = apt.deposit_percentage ?? globalSettings.payment_deposit_percentage ?? 50;

  const calcNights = () => {
    if (!checkin || !checkout) return 0;
    const diff = (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  const nights = calcNights();
  const subtotal = apt.price * nights;

  let discountAmount = 0;
  if (activeDiscount) {
    discountAmount = Math.round(subtotal * (activeDiscount.discount_percentage / 100));
  }
  const subtotalWithDiscount = subtotal - discountAmount;

  const extra = apt.extraNight ? apt.extraNight * nights : 0;
  const cleaning = 0; // Se puede añadir como campo extra en el futuro
  const total = subtotalWithDiscount + extra + cleaning;
  const deposit = Math.round(total * (depositPct / 100));

  const checkinLabel = checkin ? formatDateShort(checkin) : '';
  const checkoutLabel = checkout ? formatDateShort(checkout) : '';

  return (
    <div className="apt-booking-widget">
      <div className="apt-booking-price">{formatPrice(apt.price)}</div>
      <div className="apt-booking-price-sub">{T.detail.pricePerNight}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 2 }}>
        <div className="apt-booking-field" style={{ borderRight: '1px solid rgba(15,23,42,0.15)' }}>
          <div className="apt-booking-field-label">{T.detail.checkin}</div>
          <DatePicker
            selected={strToDate(checkin)}
            onChange={date => setCheckin(dateToStr(date))}
            minDate={new Date()}
            maxDate={strToDate(checkout) ? new Date(strToDate(checkout).getTime() - 86400000) : null}
            dateFormat={lang === 'ES' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'}
            placeholderText={lang === 'ES' ? 'dd/mm/aaaa' : 'mm/dd/yyyy'}
            className="apt-date-input"
          />
        </div>
        <div className="apt-booking-field">
          <div className="apt-booking-field-label">{T.detail.checkout}</div>
          <DatePicker
            selected={strToDate(checkout)}
            onChange={date => setCheckout(dateToStr(date))}
            minDate={strToDate(checkin) ? new Date(strToDate(checkin).getTime() + 86400000) : new Date()}
            dateFormat={lang === 'ES' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'}
            placeholderText={lang === 'ES' ? 'dd/mm/aaaa' : 'mm/dd/yyyy'}
            className="apt-date-input"
          />
        </div>
      </div>

      <div className="apt-booking-field" style={{ marginBottom: 20 }}>
        <div className="apt-booking-field-label">{T.detail.guestsLabel}</div>
        <select value={guests} onChange={e => setGuests(+e.target.value)}>
          {Array.from({ length: apt.cap }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n} {n === 1 ? T.common.person : T.common.persons}</option>
          ))}
        </select>
      </div>

      {nights > 0 ? (
        <>
          <div className="apt-booking-divider" />
          <div className="apt-booking-row">
            <span>{formatPrice(apt.price)} × {nights} {nights === 1 ? T.common.night : T.common.nights}</span>
            <strong style={{ textDecoration: discountAmount > 0 ? 'line-through' : 'none', opacity: discountAmount > 0 ? 0.6 : 1 }}>{formatPrice(subtotal)}</strong>
          </div>
          {discountAmount > 0 && (
            <div className="apt-booking-row" style={{ color: '#4CAF50', marginTop: -6 }}>
              <span style={{ fontSize: 11 }}>{T.common.offerApplied} {activeDiscount.discount_percentage}%</span>
              <strong>-{formatPrice(discountAmount)}</strong>
            </div>
          )}
          {extra > 0 && (
            <div className="apt-booking-row">
              <span>{T.detail.season}</span>
              <strong>{formatPrice(extra)}</strong>
            </div>
          )}
          <div className="apt-booking-row">
            <span>{T.detail.cleaning}</span>
            <strong>{formatPrice(cleaning)}</strong>
          </div>
          <div className="apt-booking-total">
            <span>{T.detail.total}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="apt-booking-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
            <span>💳 {depositPct}% {T.detail.depositNow}</span>
            <strong style={{ color: '#0f172a' }}>{formatPrice(deposit)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 16 }}>
            <span>💵 {T.detail.cashArrival}</span>
            <strong style={{ color: '#0f172a' }}>{formatPrice(total - deposit)}</strong>
          </div>
        </>
      ) : (
        <div style={{ height: 8 }} />
      )}

      <button
        className="btn-green"
        onClick={onBook}
        disabled={!checkin || !checkout || nights < apt.minStay}
        style={{
          opacity: (!checkin || !checkout || nights < apt.minStay) ? 0.5 : 1,
          cursor: (!checkin || !checkout || nights < apt.minStay) ? 'not-allowed' : 'pointer'
        }}
      >
        {nights > 0
          ? `${T.detail.bookBtn} · ${deposit > 0 ? `${formatPrice(deposit)}` : ''}`
          : T.detail.seeAvailability}
      </button>

      {nights > 0 && nights < apt.minStay && (
        <div className="apt-booking-unavailable">
          {T.detail.minStayWarn} {apt.minStay} {T.common.nights}
        </div>
      )}

      <div className="apt-booking-payment-note">
        {T.detail.noCommission} {cancelDays} {T.detail.daysBefore}
      </div>
    </div>
  );
}

export default function ApartmentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [apt, setApt] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({});
  const { lang, t } = useLang();
  const T = useT(lang);

  // Cargar datos
  useEffect(() => {
    async function load() {
      if (!slug) return;

      try {
        const [aptData, settings] = await Promise.all([
          fetchApartmentBySlug(slug),
          fetchSettings()
        ]);

        if (aptData) {
          setApt({
            ...aptData,
            cap: aptData.capacity || 2,
            beds: aptData.beds || 1,
            baths: aptData.baths || 1,
            minStay: aptData.min_stay || 2,
            nameEn: aptData.name_en,
            descriptionEn: aptData.description_en,
            reviewCount: aptData.review_count || 0,
            gradient: 'linear-gradient(135deg, #1a5f6e 0%, #2C4A5E 100%)',
            amenities: aptData.amenities || [],
            rules: aptData.rules || [],
            nearby: aptData.nearby || [],
            occupiedDays: [],
          });
        }
        setGlobalSettings(settings);
      } catch (err) {
        console.error('Error loading detail data:', err);
      }
    }
    load();
  }, [slug]);

  if (!apt) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '140px 80px', textAlign: 'center' }}>
          <div className="section-title">{T.detail.notFound}</div>
          <button className="btn-primary" onClick={() => navigate('/apartamentos')} style={{ marginTop: 24 }}>
            {T.detail.seeAll}
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const aptReviews = [];
  const galleryColors = [
    apt.gradient,
    apt.gradient.replace('135deg', '160deg'),
    apt.gradient.replace('135deg', '110deg'),
    apt.gradient.replace('0%', '20%').replace('100%', '80%'),
  ];

  const aptName = lang === 'EN' ? (apt.nameEn || apt.name) : apt.name;
  const aptDesc = lang === 'EN' ? (apt.descriptionEn || apt.description) : apt.description;

  const depositPct = globalSettings.payment_deposit_percentage ?? (apt.deposit_percentage || 50);
  const cancelDays = globalSettings.cancellation_days ?? (apt.cancellation_days || 14);

  return (
    <>
      <SEO
        title={aptName}
        description={aptDesc.substring(0, 160)}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      <div className="apt-detail">
        {/* GALERÍA */}
        <div className="apt-detail-gallery">
          <div className="apt-detail-photo-main">
            <div className="apt-detail-photo" style={{ background: galleryColors[0], height: '100%' }}>
              <Ico d={paths.photo} size={48} color="rgba(255,255,255,0.1)" />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="apt-detail-photo" style={{ background: galleryColors[i] }}>
              <Ico d={paths.photo} size={28} color="rgba(255,255,255,0.1)" />
            </div>
          ))}
        </div>

        {/* CUERPO */}
        <div className="apt-detail-body">
          {/* COLUMNA IZQUIERDA */}
          <div className="apt-detail-left">
            <div className="breadcrumb">
              <Link to="/">{T.seo.homeTitle}</Link>
              <span className="breadcrumb-sep">›</span>
              <Link to="/apartamentos">{T.nav.apartments}</Link>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{aptName}</span>
            </div>

            <h1 className="apt-detail-title">{aptName}</h1>

            <div className="apt-detail-meta">
              <span>★ {apt.rating} <span style={{ color: '#cbd5e1' }}>({apt.reviewCount} {T.detail.opinions})</span></span>
              <span className="apt-detail-meta-sep">·</span>
              <span>Ribadeo, Galicia</span>
              <span className="apt-detail-meta-sep">·</span>
              <span>{apt.cap} {T.apartments.persons}</span>
              <span className="apt-detail-meta-sep">·</span>
              <span>{apt.beds} {apt.beds > 1 ? T.apartments.beds : T.apartments.bed}</span>
              <span className="apt-detail-meta-sep">·</span>
              <span>{apt.baths} {apt.baths > 1 ? T.apartments.baths : T.apartments.bath}</span>
              <span className="apt-detail-meta-sep">·</span>
              <span>{T.apartments.minStay} {apt.minStay} {T.apartments.nights}</span>
            </div>

            <div className="apt-detail-section-title" style={{ marginTop: 0 }}>{T.detail.description}</div>
            <p className="apt-detail-desc">{aptDesc}</p>

            <div className="apt-detail-section-title">{T.detail.includes}</div>
            <div className="amenities-grid">
              {apt.amenities.map(am => (
                <div key={am} className="amenity-item">
                  <Ico d={amenityIcons[am] || paths.check} size={16} color="#1a5f6e" />
                  {lang === 'EN' ? (amenityTranslations[am] || am) : am}
                </div>
              ))}
            </div>
            <div className="apt-detail-section-title">{T.detail.availability}</div>
            <MiniCalendar occupiedDays={apt.occupiedDays || []} T={T} />

            <div className="apt-detail-section-title">{T.detail.rules}</div>
            <ul className="house-rules-list">
              {apt.rules.map((rule, i) => (
                <li key={i}>
                  <Ico d={paths.check} size={14} color="#1a5f6e" />
                  {rule}
                </li>
              ))}
            </ul>

            <div className="apt-detail-section-title">{T.detail.location}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {apt.nearby.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#334155', alignItems: 'center' }}>
                  <Ico d={paths.map} size={13} color="#64748b" />
                  {item}
                </div>
              ))}
            </div>
            <div className="map-placeholder" style={{ border: '1px solid rgba(15,23,42,0.1)', background: '#f8fafc', marginBottom: 0 }}>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Ico d={paths.map} size={32} color="#cbd5e1" />
                <div style={{ marginTop: 8, fontSize: 12 }}>Ribadeo, Lugo · Galicia, España</div>
              </div>
            </div>

            {aptReviews.length > 0 && (
              <>
                <div className="apt-detail-section-title">{T.detail.reviews}</div>
                <div style={{ display: 'grid', gap: 2 }}>
                  {aptReviews.map((r, i) => (
                    <div key={i} className="review-card" style={{ padding: '32px 40px' }}>
                      <div className="review-stars">{'★'.repeat(r.stars)}</div>
                      <div className="review-text">"{r.text}"</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="review-author">{r.name} · {r.origin}</div>
                        <div style={{ fontSize: 11, color: '#cbd5e1' }}>{r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* COLUMNA DERECHA: WIDGET */}
          <div className="apt-detail-right">
            <BookingWidget apt={apt} onBook={() => setBookingOpen(true)} T={T} globalSettings={globalSettings} />

            <div style={{ marginTop: 16, padding: '20px', background: '#f8fafc', fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a' }}>{T.detail.payModel}</div>
              <div>💳 {depositPct}% {T.detail.depositNow}</div>
              {depositPct < 100 && <div>💵 {100 - depositPct}% {T.detail.cashArrival}</div>}
              <div style={{ marginTop: 8, color: '#64748b' }}>
                {T.detail.noCommission} {cancelDays} {T.detail.daysBefore}
              </div>
            </div>

            <button
              className="btn-outline"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => navigate('/contacto')}
            >
              {T.detail.askApt}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {bookingOpen && (
        <BookingModal apartment={apt} onClose={() => setBookingOpen(false)} />
      )}
    </>
  );
}
