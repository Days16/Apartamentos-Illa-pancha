import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchSettings, updateSetting } from '../../services/supabaseService';

export default function Cancelacion() {
  const [cancelDays, setCancelDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const settings = await fetchSettings();
      if (settings.cancellation_days !== undefined) {
        setCancelDays(settings.cancellation_days);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Bulk update cancellation days for all active apartments
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // 1. Guardar en site_settings
      await updateSetting('cancellation_days', cancelDays, 'number');

      // 2. Aplicar a todos los apartamentos
      const { error: updateError } = await supabase
        .from('apartments')
        .update({ cancellation_days: cancelDays })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // update all

      if (updateError) throw updateError;

      setSuccess('✓ Política guardada y aplicada a todos los apartamentos');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error FULL saving policy:', err);
      const isRLS = err.code === '42501' || err.message?.includes('policy');
      setError(`Error al guardar política: ${err.message}${isRLS ? '\n\nTIP: Esto suele ser un problema de permisos RLS en Supabase. Asegúrate de haber ejecutado el SQL de configuración.' : ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Política de cancelación</div>
          <div className="main-sub">Configura el reembolso del depósito</div>
        </div>
      </div>

      <div className="main-body">
        <div className="card" style={{ padding: 32, maxWidth: 600, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#0f172a', marginBottom: 6 }}>
            Días para cancelar con reembolso
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
            Si el huésped cancela antes de este periodo, recupera el 100% del depósito
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
            <input
              type="range"
              className="slider"
              min={1}
              max={60}
              value={cancelDays}
              onChange={e => setCancelDays(+e.target.value)}
            />
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: '#0f172a', lineHeight: 1 }}>
                {cancelDays}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>días</div>
            </div>
          </div>

          <div className="policy-preview">
            <div className="policy-box policy-box-green">
              <div className="policy-box-label">Cancela con más de {cancelDays} días</div>
              <div className="policy-box-value">100% reembolso</div>
            </div>
            <div className="policy-box policy-box-red">
              <div className="policy-box-label">Cancela con menos de {cancelDays} días</div>
              <div className="policy-box-value">Sin reembolso</div>
            </div>
          </div>

          <div style={{ background: '#FEF0D0', padding: 16, marginTop: 20, fontSize: 12, color: '#8B5E0A', lineHeight: 1.6 }}>
            ⚠️ Esta política se muestra al cliente antes de confirmar el pago. Los cambios solo aplican a nuevas reservas.
          </div>
        </div>
      </div>

      <div className="save-bar">
        <span className="save-bar-hint">Política global: se aplicará a todos los apartamentos.</span>
        <button className="action-btn" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar política'}
        </button>
      </div>

      {/* NOTIFICACIONES */}
      {success && (
        <div style={{ position: 'fixed', bottom: 80, right: 24, background: '#4CAF50', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 1001, animation: 'slideIn 0.3s ease-out' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ position: 'fixed', bottom: 80, right: 24, background: '#f44', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 1001, animation: 'slideIn 0.3s ease-out' }}>
          ✗ {error}
        </div>
      )}
    </>
  );
}
