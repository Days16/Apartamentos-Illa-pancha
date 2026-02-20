import { useState, useEffect } from 'react';
import { fetchApartments } from '../../services/supabaseService';

export default function IcalAdmin() {
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    fetchApartments().then(setApartments);
  }, []);

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Canales iCal</div>
          <div className="main-sub">Gestiona la sincronización con Booking.com y Airbnb</div>
        </div>
      </div>

      <div className="main-body">
        {apartments.map((a, i) => (
          <div key={i} className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: a.gradient, flexShrink: 0 }} />
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{a.name}</div>
            </div>

            <div className="ical-row">
              <div className="ical-platform" style={{ color: '#1A4A8B' }}>Booking</div>
              <div className="ical-url">
                {i < 3
                  ? `https://admin.booking.com/hotel/hoteladmin/ical.html?t=abc${i}xyz...`
                  : '— Sin configurar —'}
              </div>
              <span className={`ical-status badge ${i < 3 ? 'badge-green' : 'badge-yellow'}`}>
                {i < 3 ? 'OK' : 'Falta'}
              </span>
              <button className="action-btn action-btn-outline" style={{ padding: '4px 10px', fontSize: 10 }}>
                {i < 3 ? 'Editar' : '+ Añadir'}
              </button>
            </div>

            <div className="ical-row" style={{ borderBottom: 'none' }}>
              <div className="ical-platform" style={{ color: '#C0392B' }}>Airbnb</div>
              <div className="ical-url">
                {i < 5
                  ? `https://www.airbnb.es/calendar/ical/${12340 + i}.ics?s=abc...`
                  : '— Sin configurar —'}
              </div>
              <span className={`ical-status badge ${i < 5 ? 'badge-green' : 'badge-yellow'}`}>
                {i < 5 ? 'OK' : 'Falta'}
              </span>
              <button className="action-btn action-btn-outline" style={{ padding: '4px 10px', fontSize: 10 }}>
                {i < 5 ? 'Editar' : '+ Añadir'}
              </button>
            </div>
          </div>
        ))}

        {/* URLs de exportación */}
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 8 }}>
            URLs de exportación (tu web → plataformas)
          </div>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
            Copia estas URLs y pégalas en la configuración de sincronización de Booking.com y Airbnb para que reciban tus reservas directas.
          </p>
          {apartments.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, width: 140, flexShrink: 0, color: '#334155' }}>{a.name}</div>
              <div style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', background: '#f8fafc', padding: '6px 10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                https://illapancha.com/api/ical/{a.slug}.ics
              </div>
              <button className="action-btn action-btn-outline" style={{ padding: '4px 10px', fontSize: 10 }}>
                Copiar
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
