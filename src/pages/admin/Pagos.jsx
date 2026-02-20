import { useState } from 'react';

export default function Pagos() {
  const [depositPct, setDepositPct] = useState(50);

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Configuración de pagos</div>
          <div className="main-sub">Modelo tarjeta + efectivo</div>
        </div>
      </div>

      <div className="main-body">
        <div className="card" style={{ padding: 32, maxWidth: 600, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#0f172a', marginBottom: 6 }}>
            Porcentaje del depósito con tarjeta
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
            El resto se cobra en efectivo al llegar al apartamento
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
            <input
              type="range"
              className="slider"
              min={10}
              max={100}
              step={5}
              value={depositPct}
              onChange={e => setDepositPct(+e.target.value)}
            />
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: '#0f172a', lineHeight: 1 }}>
                {depositPct}%
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>tarjeta</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 24 }}>
            <div style={{ background: '#DDEEFF', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1A4A8B', marginBottom: 8 }}>
                💳 Tarjeta ahora
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: '#1A2A5E' }}>{depositPct}%</div>
              <div style={{ fontSize: 12, color: '#4A6A9E', marginTop: 4 }}>
                Ej: {Math.round(1020 * depositPct / 100)} € de 1.020 €
              </div>
            </div>
            <div style={{ background: '#FEF0D0', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B5E0A', marginBottom: 8 }}>
                💵 Efectivo al llegar
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: '#5E3A0A' }}>{100 - depositPct}%</div>
              <div style={{ fontSize: 12, color: '#8B6A2E', marginTop: 4 }}>
                Ej: {Math.round(1020 * (100 - depositPct) / 100)} € de 1.020 €
              </div>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-info-title">Aceptar pagos online activo</div>
              <div className="toggle-info-sub">Desactivar para solo reservas manuales</div>
            </div>
            <div className="toggle"><div className="toggle-knob" /></div>
          </div>
          <div className="toggle-row" style={{ borderBottom: 'none' }}>
            <div>
              <div className="toggle-info-title">Confirmación automática</div>
              <div className="toggle-info-sub">Confirmar sin revisión manual al recibir el pago</div>
            </div>
            <div className="toggle"><div className="toggle-knob" /></div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, maxWidth: 600 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 16 }}>
            Integración Stripe
          </div>
          <div style={{ background: '#f8fafc', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>
              Estado
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              ⚠ Stripe no configurado — modo prototipo activo
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Cuando tengas cuenta Stripe, añade aquí tu clave de API
            </div>
          </div>
          <div className="form-group">
            <label className="form-group-label">Clave pública de Stripe (pk_live_...)</label>
            <input className="form-control" placeholder="pk_live_..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group-label">Clave secreta de Stripe (sk_live_...)</label>
            <input className="form-control" type="password" placeholder="sk_live_..." />
          </div>
        </div>
      </div>

      <div className="save-bar">
        <span className="save-bar-hint">Configuración actual: {depositPct}% tarjeta · {100 - depositPct}% efectivo</span>
        <button className="action-btn">Guardar configuración</button>
      </div>
    </>
  );
}
