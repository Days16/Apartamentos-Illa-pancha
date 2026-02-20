import { useState, useEffect } from 'react';
import { fetchSettings, updateSetting } from '../../services/supabaseService';
import { formatDateShort, formatPrice } from '../../utils/format';
import { supabase } from '../../lib/supabase';

export default function Pagos() {
  const [depositPct, setDepositPct] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const settings = await fetchSettings();
      if (settings.payment_deposit_percentage !== undefined) {
        setDepositPct(settings.payment_deposit_percentage);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. Guardar en site_settings para global
      await updateSetting('payment_deposit_percentage', depositPct, 'number');

      // 2. Aplicar a todos los apartamentos para consistencia
      const { error } = await supabase
        .from('apartments')
        .update({ deposit_percentage: depositPct })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Todos

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error FULL saving payment settings:', err);
      const isRLS = err.code === '42501' || err.message?.includes('policy');
      alert(`Error al guardar: ${err.message}${isRLS ? '\n\nTIP: Esto suele ser un problema de permisos RLS en Supabase. Revisa el SQL de configuración.' : ''}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Cargando configuración...</div>;

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
              style={{ flex: 1, height: 6, borderRadius: 3, appearance: 'none', background: '#e2e8f0' }}
            />
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: '#0f172a', lineHeight: 1 }}>
                {depositPct}%
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>tarjeta</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 24 }}>
            <div style={{ background: '#e0f2fe', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0369a1', marginBottom: 8 }}>
                💳 Tarjeta ahora
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: '#0c4a6e' }}>{depositPct}%</div>
              <div style={{ fontSize: 12, color: '#0369a1', marginTop: 4 }}>
                Ej: {formatPrice(Math.round(1020 * depositPct / 100))} de {formatPrice(1020)}
              </div>
            </div>
            <div style={{ background: '#fef3c7', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e', marginBottom: 8 }}>
                💵 Efectivo al llegar
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: '#78350f' }}>{100 - depositPct}%</div>
              <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
                Ej: {formatPrice(Math.round(1020 * (100 - depositPct) / 100))} de {formatPrice(1020)}
              </div>
            </div>
          </div>

          {success && (
            <div style={{ padding: '12px 16px', borderRadius: 6, background: '#f0fdf4', color: '#166534', fontSize: 13, border: '1px solid #bbf7d0', marginBottom: 16 }}>
              ✓ Configuración guardada correctamente
            </div>
          )}
        </div>
      </div>

      <div className="save-bar">
        <span className="save-bar-hint">Configuración actual: {depositPct}% tarjeta · {100 - depositPct}% efectivo</span>
        <button
          className="action-btn"
          onClick={handleSave}
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </>
  );
}
