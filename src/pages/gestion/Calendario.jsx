import { useState, useEffect } from 'react';
import { fetchApartments } from '../../services/supabaseService';
import { MESES } from '../../utils/formatDate';

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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function Calendario() {
  const now = new Date(2026, 1);
  const [current, setCurrent] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [tooltip, setTooltip] = useState(null); // { day, x, y, apts }
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    fetchApartments().then(setApartments);
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
    return apartments.map((apt, idx) => ({
      ...apt,
      color: APT_COLORS[idx % APT_COLORS.length],
      hasBooking: apt.occupiedDays && apt.occupiedDays.includes(day),
    })).filter(a => a.hasBooking);
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
                  className={`month-cal-cell ${!day ? 'month-cal-cell-empty' : ''} ${isToday(day) ? 'month-cal-today' : ''}`}
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
                        {apt.cap} pers. · desde {apt.price} €/noche
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
