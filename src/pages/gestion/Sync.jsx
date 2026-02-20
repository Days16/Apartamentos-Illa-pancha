import { useState } from 'react';

const syncData = [
  { apt: 'Apt. Cantábrico', bk: 'hace 12 min', ab: 'hace 8 min', ok: true },
  { apt: 'Apt. Ribadeo', bk: 'hace 15 min', ab: 'hace 15 min', ok: true },
  { apt: 'Apt. Illa Pancha', bk: 'Error — URL caducada', ab: 'hace 18 min', ok: false },
  { apt: 'Apt. Eo', bk: 'hace 22 min', ab: 'hace 22 min', ok: true },
  { apt: 'Apt. Castro', bk: 'hace 28 min', ab: 'hace 28 min', ok: true },
  { apt: 'Apt. Pedrido', bk: 'hace 30 min', ab: 'hace 30 min', ok: true },
  { apt: 'Apt. Figueirido', bk: 'hace 31 min', ab: 'hace 31 min', ok: true },
  { apt: 'Apt. San Damián', bk: 'hace 32 min', ab: 'hace 32 min', ok: true },
];

export default function Sync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('hace 4 min');

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync('ahora mismo');
    }, 2000);
  };

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Sincronización iCal</div>
          <div className="main-sub">
            Sync automático cada 30 min · Última vez: {lastSync}
          </div>
        </div>
        <button
          className="action-btn"
          onClick={handleSync}
          disabled={syncing}
          style={{ background: syncing ? '#64748b' : undefined }}
        >
          {syncing ? '⟳ Sincronizando...' : 'Sincronizar todo ahora'}
        </button>
      </div>

      <div className="main-body">
        {/* Aviso error */}
        <div style={{ background: '#FDE8E8', border: '1px solid rgba(192,57,43,0.15)', padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ color: '#C0392B', fontWeight: 600 }}>⚠</span>
          <span style={{ color: '#8B1A1A' }}>
            <strong>Apt. Illa Pancha · Booking.com:</strong> URL de iCal caducada. Es necesario renovarla desde el panel de Booking para evitar dobles reservas.
          </span>
          <a href="/admin/ical" style={{ marginLeft: 'auto', color: '#C0392B', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Solucionar →
          </a>
        </div>

        <div className="card">
          {syncData.map((s, i) => (
            <div
              key={i}
              className="table-row"
              style={{ gridTemplateColumns: '1.5fr 2fr 2fr auto', gap: 24, alignItems: 'center' }}
            >
              <div style={{ fontWeight: 500, fontSize: 13, color: '#0f172a' }}>{s.apt}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                  Booking.com
                </span>
                <span style={{ fontSize: 12, color: s.bk.startsWith('Error') ? '#C0392B' : '#334155' }}>
                  {s.bk}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                  Airbnb
                </span>
                <span style={{ fontSize: 12, color: '#334155' }}>{s.ab}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${s.ok ? 'badge-green' : 'badge-red'}`}>
                  {s.ok ? 'OK' : 'Error'}
                </span>
                <button className="action-btn action-btn-outline" style={{ padding: '4px 12px', fontSize: 10 }}>
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ayuda */}
        <div style={{ marginTop: 24, background: '#f8fafc', padding: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 8 }}>
            ¿Cómo funciona la sincronización?
          </div>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Nuestra web importa los calendarios iCal de Booking.com y Airbnb cada 30 minutos para bloquear automáticamente las fechas ya reservadas. También puedes sincronizar manualmente en cualquier momento.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Importación (Booking/Airbnb → Tu web)
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                Cada 30 min se descarga el .ics de cada plataforma y se bloquean esas fechas en tu calendario.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Exportación (Tu web → Booking/Airbnb)
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                Tu web genera URLs iCal para cada apartamento que debes configurar en Booking y Airbnb.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
