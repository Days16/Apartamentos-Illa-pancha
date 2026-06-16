/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';
import { fetchSettings, updateSetting, logAudit } from '../../services/supabaseService';
import { PORTAL_SECTION_GROUPS, getEnabledSectionIds } from '../../utils/portalSections';
import { formatPrice } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import Ico, { paths } from '../../components/Ico';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { PanelPageHeader, PanelConfirm } from '../../components/panel';

export default function ConfiguracionGeneral() {
  const { refreshSettings } = useSettings();
  const toast = useToast();
  const [portalSections, setPortalSections] = useState<string[]>(['gestion_dashboard', 'gestion_reservas', 'gestion_calendario']);
  const [settings, setSettings] = useState({
    cancellation_free_days: 14,
    payment_deposit_percentage: 50,
    tax_percentage: 10,
    maintenance_mode: false,
    booking_mode: 'modal',
    booking_com_url: '',
    checkin_access_info: '',
    checkin_house_rules: '',
    contact_phone: '',
    contact_whatsapp: '',
    property_address: '',
    avaibook_mode: 'off',
    avaibook_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cancelacion' | 'pagos' | 'checkin' | 'mantenimiento' | 'avaibook' | 'portal'>(
    'cancelacion'
  );

  const TABS = [
    { id: 'cancelacion', label: 'Cancelación' },
    { id: 'pagos', label: 'Pagos & IVA' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'mantenimiento', label: 'Mantenimiento' },
    { id: 'avaibook', label: 'Avaibook' },
    { id: 'portal', label: 'Portal Usuario' },
  ] as const;

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
        setSettings({
          cancellation_free_days: data.cancellation_free_days ?? 14,
          payment_deposit_percentage: data.payment_deposit_percentage ?? 50,
          tax_percentage: data.tax_percentage ?? 10,
          maintenance_mode: data.maintenance_mode ?? false,
          booking_mode: data.booking_mode ?? 'modal',
          booking_com_url: data.booking_com_url ?? '',
          avaibook_mode: data.avaibook_mode ?? 'off',
          avaibook_url: data.avaibook_url ?? '',
          checkin_access_info: data.checkin_access_info ?? '',
          checkin_house_rules: data.checkin_house_rules ?? '',
          contact_phone: data.contact_phone ?? '',
          contact_whatsapp: data.contact_whatsapp ?? '',
          property_address: data.property_address ?? '',
        });
        setPortalSections(getEnabledSectionIds(data));
      } catch (err) {
        console.error('Error cargando ajustes:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 1. Save to site_settings
      await Promise.all([
        updateSetting('cancellation_free_days', settings.cancellation_free_days, 'number'),
        updateSetting('payment_deposit_percentage', settings.payment_deposit_percentage, 'number'),
        updateSetting('tax_percentage', settings.tax_percentage, 'number'),
        updateSetting('maintenance_mode', settings.maintenance_mode, 'boolean'),
        updateSetting('booking_mode', settings.booking_mode, 'string'),
        updateSetting('booking_com_url', settings.booking_com_url, 'string'),
        updateSetting('checkin_access_info', settings.checkin_access_info, 'string'),
        updateSetting('checkin_house_rules', settings.checkin_house_rules, 'string'),
        updateSetting('contact_phone', settings.contact_phone, 'string'),
        updateSetting('contact_whatsapp', settings.contact_whatsapp, 'string'),
        updateSetting('property_address', settings.property_address, 'string'),
        updateSetting('avaibook_mode', settings.avaibook_mode, 'string'),
        updateSetting('avaibook_url', settings.avaibook_url, 'string'),
        updateSetting('portal_user_sections', JSON.stringify(portalSections), 'string'),
      ]);

      // 2. Sync with apartments table (manual propagation)
      // Actualizamos todos los apartamentos para que usen estos nuevos valores por defecto
      const { error: syncError } = await supabase
        .from('apartments')
        .update({
          cancellation_days: settings.cancellation_free_days,
          deposit_percentage: settings.payment_deposit_percentage,
        })
        .neq('slug', 'template'); // Update all real ones

      if (syncError) throw syncError;

      // 3. Refrescar el contexto global
      await refreshSettings();

      logAudit('update_settings', 'settings', 'global');
      toast.success('Configuración guardada y aplicada correctamente');
    } catch (err) {
      console.error('Error guardando configuración:', err);
      toast.error('Error al guardar los cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="panel-page-content text-gray-500">Cargando configuración global...</div>;

  return (
    <div className="panel-page-content pb-24">
      <PanelPageHeader
        title="Ajustes Generales"
        subtitle="Configura las políticas globales de la plataforma"
      />

      {/* Tab bar */}
      <div className="panel-tabs-pills">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`panel-tab-pill${activeTab === tab.id ? ' panel-tab-pill--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl space-y-6">
        {/* POLÍTICA DE CANCELACIÓN */}
        {activeTab === 'cancelacion' && (
          <section className="panel-card overflow-hidden !p-0">
            <div className="p-6 border-b border-gray-100 flex items-start gap-4">
              <div className="mt-1">
                <Ico d={paths.calendar} size={20} color="#64748b" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Política de Cancelación</h2>
                <p className="text-xs text-gray-500">
                  Define cuántos días antes el cliente puede cancelar gratis
                </p>
              </div>
            </div>
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 w-full translate-y-2">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.cancellation_free_days}
                    onChange={e => handleChange('cancellation_free_days', +e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                    <span>1 día</span>
                    <span>30 días</span>
                    <span>60 días</span>
                  </div>
                </div>
                <div className="w-32 h-32 rounded-2xl bg-navy text-white flex flex-col items-center justify-center shadow-lg transform rotate-2">
                  <span className="text-4xl font-serif font-bold">
                    {settings.cancellation_free_days}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">
                    Días
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-[10px] font-bold text-green-700 uppercase mb-1">
                    Más de {settings.cancellation_free_days} días
                  </div>
                  <div className="text-lg font-serif font-bold text-green-900">Reembolso 100%</div>
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-[10px] font-bold text-red-700 uppercase mb-1">
                    Menos de {settings.cancellation_free_days} días
                  </div>
                  <div className="text-lg font-serif font-bold text-red-900">Sin reembolso</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PAGOS E IMPUESTOS */}
        {activeTab === 'pagos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="panel-card overflow-hidden !p-0">
              <div className="p-6 border-b border-gray-100 flex items-start gap-4">
                <div className="mt-1">
                  <Ico d={paths.tag} size={20} color="#64748b" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Pagos y Reservas</h2>
                  <p className="text-xs text-gray-500">Distribución de pago Tarjeta / Efectivo</p>
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <label className="panel-label block mb-4">
                    Deposito con Tarjeta: {settings.payment_deposit_percentage}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.payment_deposit_percentage}
                    onChange={e => handleChange('payment_deposit_percentage', +e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-700 font-medium">💳 Pago online</span>
                    <span className="text-lg font-bold text-blue-900">
                      {settings.payment_deposit_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-xs text-amber-700 font-medium">💵 Pago en llegada</span>
                    <span className="text-lg font-bold text-amber-900">
                      {100 - settings.payment_deposit_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel-card overflow-hidden !p-0">
              <div className="p-6 border-b border-gray-100 flex items-start gap-4">
                <div className="mt-1">
                  <Ico d={paths.check} size={20} color="#64748b" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Tasas e Impuestos</h2>
                  <p className="text-xs text-gray-500">Porcentaje aplicado al total bruto</p>
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <label className="panel-label block mb-4">
                    IVA / Tasas: {settings.tax_percentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={settings.tax_percentage}
                    onChange={e => handleChange('tax_percentage', +e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
                <div className="rounded-xl overflow-hidden border panel-border-color">
                  <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest panel-surface-2-bg panel-text-muted">
                    Simulador — ejemplo 120 €
                  </div>
                  {(() => {
                    const base = 120;
                    const total = Math.round(base * (1 + settings.tax_percentage / 100));
                    const tarjeta = Math.round((total * settings.payment_deposit_percentage) / 100);
                    const efectivo = total - tarjeta;
                    return (
                      <div>
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b panel-border-color">
                          <span className="panel-text-muted">Precio base</span>
                          <span className="font-medium panel-text-main">{formatPrice(base)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b panel-border-color">
                          <span className="panel-text-muted">+{settings.tax_percentage}% IVA</span>
                          <span className="font-medium text-amber-600">
                            +{formatPrice(total - base)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm font-bold border-b panel-border-color panel-surface-2-bg">
                          <span className="panel-text-main">Total</span>
                          <span className="panel-text-accent">{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2 text-xs border-b panel-border-color">
                          <span className="text-blue-600">
                            💳 Tarjeta ahora ({settings.payment_deposit_percentage}%)
                          </span>
                          <span className="font-semibold text-blue-700">
                            {formatPrice(tarjeta)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2 text-xs">
                          <span className="text-amber-700">
                            💵 Efectivo al llegar ({100 - settings.payment_deposit_percentage}%)
                          </span>
                          <span className="font-semibold text-amber-800">
                            {formatPrice(efectivo)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* MODO BOTONES DE RESERVA */}
        {activeTab === 'pagos' && (
          <section className="panel-card overflow-hidden !p-0">
            <div className="p-6 border-b border-gray-100 flex items-start gap-4">
              <div className="mt-1">
                <Ico d={paths.tag} size={20} color="#64748b" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Botones de Reserva</h2>
                <p className="text-xs text-gray-500">
                  Decide qué ocurre cuando un cliente pulsa "Reservar" en la web
                </p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Selector de modo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleChange('booking_mode', 'modal')}
                  className={`flex flex-col items-start gap-2 p-5 rounded-xl border-2 text-left transition-all ${settings.booking_mode !== 'redirect' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.booking_mode !== 'redirect' ? 'border-teal-600' : 'border-gray-300'}`}
                    >
                      {settings.booking_mode !== 'redirect' && (
                        <div className="w-2 h-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                    <span className="font-bold text-navy text-sm">Modal de reserva</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-6">
                    Abre el formulario de reserva integrado en la web (comportamiento actual)
                  </p>
                </button>

                <button
                  onClick={() => handleChange('booking_mode', 'redirect')}
                  className={`flex flex-col items-start gap-2 p-5 rounded-xl border-2 text-left transition-all ${settings.booking_mode === 'redirect' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.booking_mode === 'redirect' ? 'border-teal-600' : 'border-gray-300'}`}
                    >
                      {settings.booking_mode === 'redirect' && (
                        <div className="w-2 h-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                    <span className="font-bold text-navy text-sm">Página de reserva</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-6">
                    Redirige a <code className="bg-gray-100 px-1 rounded">/reservar</code> con
                    formulario de contacto directo
                  </p>
                </button>
              </div>

              {/* Preview */}
              {settings.booking_mode === 'redirect' && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    className="mt-0.5 flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Los botones "Reservar" de toda la web redirigirán a <strong>/reservar</strong>{' '}
                    con el formulario de contacto.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CHECK-IN Y CONTACTO */}
        {activeTab === 'checkin' && (
          <section className="panel-card overflow-hidden !p-0">
            <div className="p-6 border-b border-gray-100 flex items-start gap-4">
              <div className="mt-1">
                <Ico d={paths.lock} size={20} color="#64748b" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Check-in y Contacto</h2>
                <p className="text-xs text-gray-500">
                  Se muestra al huésped 48h antes de su llegada en el portal de reservas
                </p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="panel-label mb-2">Dirección del alojamiento</label>
                  <input
                    type="text"
                    value={settings.property_address}
                    onChange={e => handleChange('property_address', e.target.value)}
                    placeholder="Ej: Calle Illa Pancha 1, 27700 Ribadeo"
                    className="panel-input"
                  />
                </div>
                <div>
                  <label className="panel-label mb-2">Teléfono de contacto</label>
                  <input
                    type="text"
                    value={settings.contact_phone}
                    onChange={e => handleChange('contact_phone', e.target.value)}
                    placeholder="Ej: +34 600 000 000"
                    className="panel-input"
                  />
                </div>
                <div>
                  <label className="panel-label mb-2">WhatsApp (solo dígitos)</label>
                  <input
                    type="text"
                    value={settings.contact_whatsapp}
                    onChange={e => handleChange('contact_whatsapp', e.target.value)}
                    placeholder="Ej: 34600000000"
                    className="panel-input"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Prefijo + número sin espacios ni signos. Ej: 34600000000
                  </p>
                </div>
              </div>
              <div>
                <label className="panel-label mb-2">Instrucciones de acceso</label>
                <textarea
                  value={settings.checkin_access_info}
                  onChange={e => handleChange('checkin_access_info', e.target.value)}
                  rows={2}
                  placeholder="Ej: La caja de llaves está junto a la puerta principal. Introduce el código en el teclado numérico."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-navy focus:outline-none focus:ring-2 focus:ring-teal/20 resize-none"
                />
              </div>
              <div>
                <label className="panel-label mb-2">Normas de la finca</label>
                <textarea
                  value={settings.checkin_house_rules}
                  onChange={e => handleChange('checkin_house_rules', e.target.value)}
                  rows={4}
                  placeholder="Ej: No se permiten mascotas. Horario de silencio de 23:00 a 08:00. Check-out antes de las 12:00."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-navy focus:outline-none focus:ring-2 focus:ring-teal/20 resize-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* ESTADO DEL SITIO */}
        {activeTab === 'mantenimiento' && (
          <section className="panel-card overflow-hidden !p-0">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Ico
                    d={paths.lock}
                    size={20}
                    color={settings.maintenance_mode ? '#e11d48' : '#64748b'}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Modo Mantenimiento</h2>
                  <p className="text-xs text-gray-500">
                    Si se activa, los clientes verán una pantalla de "Próximamente"
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChange('maintenance_mode', !settings.maintenance_mode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </section>
        )}
        {/* AVAIBOOK */}
        {activeTab === 'avaibook' && (
          <section className="panel-card overflow-hidden !p-0">
            <div className="p-6 border-b border-gray-100 flex items-start gap-4">
              <div className="mt-1">
                <Ico d={paths.tag} size={20} color="#64748b" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Integración Avaibook</h2>
                <p className="text-xs text-gray-500">
                  Muestra el motor de reservas de Avaibook como complemento o sustituto del sistema propio
                </p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Selector de modo */}
              <div>
                <label className="panel-label mb-3 block">Modo de integración</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { value: 'off', label: 'Desactivado', desc: 'Solo sistema propio (comportamiento actual)' },
                    { value: 'link', label: 'Complemento (enlace)', desc: 'Widget propio + botón secundario a Avaibook' },
                    { value: 'iframe', label: 'Complemento (iframe)', desc: 'Widget propio + iframe de Avaibook debajo' },
                    { value: 'link_only', label: 'Solo Avaibook (enlace)', desc: 'Oculta el widget propio, muestra solo un botón a Avaibook' },
                    { value: 'iframe_only', label: 'Solo Avaibook (iframe)', desc: 'Oculta el widget propio, muestra solo el iframe de Avaibook' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('avaibook_mode', opt.value)}
                      className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${settings.avaibook_mode === opt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${settings.avaibook_mode === opt.value ? 'border-teal-600' : 'border-gray-300'}`}>
                          {settings.avaibook_mode === opt.value && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                        </div>
                        <span className="font-bold text-navy text-xs">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed pl-6">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL global */}
              <div className={settings.avaibook_mode === 'off' ? 'opacity-40 pointer-events-none' : ''}>
                <label className="panel-label mb-2 block">URL global del motor de Avaibook</label>
                <input
                  type="url"
                  value={settings.avaibook_url}
                  onChange={e => handleChange('avaibook_url', e.target.value)}
                  placeholder="https://app.avaibook.com/..."
                  className="panel-input"
                  disabled={settings.avaibook_mode === 'off'}
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Obtenlo en Avaibook → Motor de Reservas → Publicar en mi Web → Link Web. Cada apartamento puede tener su propia URL en su panel de edición.
                </p>
              </div>

              {/* Aviso si no hay URL */}
              {settings.avaibook_mode !== 'off' && !settings.avaibook_url && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Añade una URL para que la integración funcione. Si un apartamento tiene URL propia, tendrá prioridad sobre esta URL global.
                  </p>
                </div>
              )}

              {/* Vista previa del modo actual */}
              {settings.avaibook_mode !== 'off' && settings.avaibook_url && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Vista previa</div>
                  <p className="text-xs text-green-800 leading-relaxed">
                    {settings.avaibook_mode === 'link' && 'Los huéspedes verán el widget de reservas + un botón secundario "Reservar con Avaibook".'}
                    {settings.avaibook_mode === 'iframe' && 'Los huéspedes verán el widget de reservas + el iframe de Avaibook debajo.'}
                    {settings.avaibook_mode === 'link_only' && 'El widget propio quedará oculto. Los huéspedes solo verán un botón que abre Avaibook.'}
                    {settings.avaibook_mode === 'iframe_only' && 'El widget propio quedará oculto. Los huéspedes solo verán el iframe de Avaibook.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
        {/* PORTAL DE USUARIO */}
        {activeTab === 'portal' && (
          <div className="space-y-5">
            <div className="panel-card !p-4 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Plantilla por defecto</strong> para todos los trabajadores con rol <code>usuario</code>.
                Cada trabajador puede tener una configuración individual: ve a <strong>Admin → Usuarios</strong> y pulsa el botón <strong>"Secciones"</strong> en su fila para personalizarlo.
                Si un trabajador tiene secciones configuradas individualmente, esas tienen prioridad sobre esta plantilla.
              </p>
            </div>

            {PORTAL_SECTION_GROUPS.map(group => (
              <section key={group.id} className="panel-card overflow-hidden !p-0">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{group.label}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ids = group.sections.map(s => s.id);
                        setPortalSections(prev => [...new Set([...prev, ...ids])]);
                      }}
                      className="text-[11px] text-teal-600 hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const ids = new Set(group.sections.map(s => s.id));
                        setPortalSections(prev => prev.filter(id => !ids.has(id)));
                      }}
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>
                <div className="divide-y panel-border-color">
                  {group.sections.map(section => {
                    const enabled = portalSections.includes(section.id);
                    return (
                      <div key={section.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Ico d={section.icon} size={15} color={enabled ? '#1a5f6e' : '#94a3b8'} />
                          <span className={`text-sm ${enabled ? 'panel-text-main font-medium' : 'panel-text-muted'}`}>
                            {section.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPortalSections(prev =>
                              enabled ? prev.filter(id => id !== section.id) : [...prev, section.id]
                            )
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-teal-500' : 'bg-gray-200'}`}
                          aria-label={section.label}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {portalSections.length === 0 && (
              <div className="text-center py-4 text-xs text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                Sin secciones activas. Los usuarios con rol <strong>usuario</strong> verán solo la pantalla de inicio del portal.
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER ACCIONES */}
      <div className="panel-sticky-footer">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={saving}
          className="panel-btn panel-btn-primary flex items-center gap-2"
        >
          {saving && (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      <PanelConfirm
        open={confirmOpen}
        title="¿Guardar configuración?"
        description="Se aplicarán los cambios globales de cancelación, depósito e impuestos a todos los apartamentos."
        confirmLabel="Guardar"
        onConfirm={() => {
          setConfirmOpen(false);
          handleSave();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
