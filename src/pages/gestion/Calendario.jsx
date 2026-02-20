import { useState, useEffect } from 'react';
import { getApartments, getReservations } from '../../services/dataService';
import { formatDateNumeric } from '../../utils/format';

const APT_COLORS = [
  { bg: '#DDEEFF', text: '#1A4A8B', border: '#4A7AB5' },
  { bg: '#FFE4D6', text: '#8B3E0A', border: '#C07040' },
  { bg: '#D4F0E0', text: '#164e63', border: '#3A9A5A' },
  { bg: '#FEF0D0', text: '#8B5E0A', border: '#C09030' },
  { bg: '#EAD8F5', text: '#5A1A8B', border: '#8A50BB' },
  { bg: '#F5D5D5', text: '#8B1A1A', border: '#BB5050' },
  { bg: '#D5E8FF', text: '#1A3A8B', border: '#4A6ABB' },
  { bg: '#F5EBD5', text: '#6B4A0A', border: '#9A7030' },
];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const parseBookingDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  try {
    // 1. Intentar parseo nativo (ISO listo)
    if (typeof dateStr === 'string' && dateStr.includes('-') && !isNaN(Date.parse(dateStr))) {
      return new Date(dateStr);
    }

    // 2. Parseo manual para formatos comunes
    const months = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    };

    const cleanStr = dateStr.replace(/\./g, '').toLowerCase().trim();
    const parts = cleanStr.split(/[\s/-]+/);

    if (parts.length >= 2) {
      let day, month, year;

      if (parts[0].length === 4) { // YYYY-MM-DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else { // DD-MM-YYYY o DD Mes YYYY
        day = parseInt(parts[0]);
        const monthStr = parts[1];
        year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
        if (year < 100) year += 2000;

        if (!isNaN(monthStr)) {
          month = parseInt(monthStr) - 1;
        } else {
          const shortMonth = monthStr.substring(0, 3);
          month = months[shortMonth];
        }
      }

      if (!isNaN(day) && !isNaN(month) && month !== undefined && !isNaN(year)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  } catch (err) {
    console.error('Error parseando fecha:', dateStr, err);
  }
  return null;
};

export default function Calendario() {
  const now = new Date();
  const [current, setCurrent] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [tooltip, setTooltip] = useState(null); // { day, x, y, apts }
  const [apartments, setApartments] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    getApartments().then(apts => {
      //console.log('Calendario: Apartamentos cargados:', apts.length);
      setApartments(apts);
    });
    getReservations().then(data => {
      const active = data.filter(r => r.status !== 'cancelled');
      //console.log('Calendario: Reservas activas:', active.length);
      if (active.length > 0) {
        //console.log('Calendario: Ejemplo de reserva:', active[0]);
      }
      setReservations(active);
    });
  }, []);

  const { year, month } = current;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 });
  const nextMonth = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getAptsForDay = (day) => {
    if (!day) return [];

    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return apartments.map((apt, idx) => {
      let bookingGuest = null;
      // Buscar si hay alguna reserva para este apartamento en este día
      const hasBooking = reservations.some(res => {
        // Comparar por slug (normalizado o crudo)
        const resSlug = res.aptSlug || res.apt_slug || res.apt;
        if (resSlug !== apt.slug) return false;

        const checkin = parseBookingDate(res.checkin);
        const checkout = parseBookingDate(res.checkout);

        if (!checkin || !checkout) return false;

        checkin.setHours(0, 0, 0, 0);
        checkout.setHours(0, 0, 0, 0);

        // El día está ocupado si está entre checkin (inclusive) y checkout (exclusive)
        const isOccupied = targetDate >= checkin && targetDate < checkout;
        if (isOccupied) {
          bookingGuest = res.guest || 'Reserva';
        }
        return isOccupied;
      });

      return {
        ...apt,
        color: APT_COLORS[idx % APT_COLORS.length],
        hasBooking: !!bookingGuest,
        guest: bookingGuest
      };
    }).filter(a => a.hasBooking);
  };

  const today = new Date();
  const isToday = (day) =>
    day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const monthLabel = MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1);

  const handleCellEnter = (e, day) => {
    if (!day) return;
    const aptsHere = getAptsForDay(day);
    if (aptsHere.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.month-cal-grid').getBoundingClientRect();
    setTooltip({
      day,
      apts: aptsHere,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
    });
  };

  const handleCellLeave = () => setTooltip(null);

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Calendario</div>
          <div className="main-sub">Vista mensual · {monthLabel} {year}</div>
        </div>
        <button className="action-btn action-btn-outline" style={{ padding: '6px 14px', fontSize: 11 }}>
          Bloquear fechas
        </button>
      </div>

      <div className="main-body">
        <div className="card" style={{ padding: 24 }}>
          {/* Navegación */}
          <div className="month-cal-nav">
            <button className="month-cal-nav-btn" onClick={prevMonth}>
              ← {MESES[month === 0 ? 11 : month - 1]}
            </button>
            <div className="month-cal-title">{monthLabel} {year}</div>
            <button className="month-cal-nav-btn" onClick={nextMonth}>
              {MESES[month === 11 ? 0 : month + 1]} →
            </button>
          </div>

          {/* Cabeceras */}
          <div className="month-cal-grid" style={{ marginBottom: 2 }}>
            {DAY_LABELS.map(d => (
              <div key={d} className="month-cal-header-cell">{d}</div>
            ))}
          </div>

          {/* Celdas con tooltip */}
          <div className="month-cal-grid" style={{ position: 'relative' }}>
            {cells.map((day, idx) => {
              const aptsHere = getAptsForDay(day);
              const occupied = aptsHere.length;
              return (
                <div
                  key={idx}
                  className={`month - cal - cell ${!day ? 'month-cal-cell-empty' : ''} ${isToday(day) ? 'month-cal-today' : ''} `}
                  onMouseEnter={e => handleCellEnter(e, day)}
                  onMouseLeave={handleCellLeave}
                >
                  {day && (
                    <>
                      <div className="month-cal-day-num" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{day}</span>
                        {occupied > 0 && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, background: '#0f172a', color: '#ffffff',
                            borderRadius: 2, padding: '1px 4px', letterSpacing: '0.05em',
                          }}>{occupied}</span>
                        )}
                      </div>
                      <div className="month-cal-bars">
                        {aptsHere.map(apt => (
                          <div
                            key={apt.slug}
                            className="month-cal-bar"
                            style={{ background: apt.color.border }}
                            title={apt.name}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* TOOLTIP */}
            {tooltip && (
              <div
                className="cal-tooltip"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                }}
                onMouseEnter={() => { }} // mantener visible mientras el ratón está encima
              >
                <div className="cal-tooltip-header">
                  {tooltip.day} de {MESES[month]} {year}
                  <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 6 }}>
                    · {tooltip.apts.length} reserva{tooltip.apts.length > 1 ? 's' : ''}
                  </span>
                </div>
                {tooltip.apts.map(apt => (
                  <div key={apt.slug} className="cal-tooltip-row">
                    <div
                      className="cal-tooltip-dot"
                      style={{ background: apt.color.border }}
                    />
                    <div>
                      <div className="cal-tooltip-apt">{apt.name}</div>
                      <div className="cal-tooltip-meta">
                        👤 {apt.guest}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="cal-tooltip-arrow" />
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="month-cal-legend">
            {apartments.map((apt, idx) => (
              <div key={apt.slug} className="month-cal-legend-item">
                <div className="month-cal-legend-dot" style={{ background: APT_COLORS[idx % APT_COLORS.length].border }} />
                <span>{apt.name}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            Pasa el ratón sobre un día para ver el detalle de las reservas. Sincronización con Booking.com y Airbnb cada 30 minutos.
          </div>
        </div>
      </div>
    </>
  );
}
