import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchAllApartments } from '../../services/supabaseService';
import Ico, { paths } from '../../components/Ico';
import { PanelPageHeader, PanelConfirm } from '../../components/panel';
import { useToast } from '../../contexts/ToastContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function timeAgo(iso: string) {
  if (!iso) return 'Nunca';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora mismo';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} días`;
}

const PLATFORM_LABELS: Record<string, string> = { booking: 'Booking.com', avaibook: 'Avaibook', airbnb: 'Airbnb' };
const PLATFORM_COLORS: Record<string, string> = {
  booking:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  avaibook: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  airbnb:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function IcalAdmin() {
  const toast = useToast();
  const [sources, setSources] = useState<Array<{ id: string; apartment_slug: string; url: string; active: boolean; last_sync: string | null; last_status: string | null; last_message?: string | null; platform?: string }>>([]);
  const [apartments, setApartments] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [form, setForm] = useState({ apartment_slug: '', url: '', platform: 'booking' as 'booking' | 'avaibook' | 'airbnb' });
  const [guideTab, setGuideTab] = useState<'booking' | 'avaibook' | 'airbnb'>('booking');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; slug: string } | null>(null);

  const load = async () => {
    const [{ data: src }, apts] = await Promise.all([
      supabase.from('ical_sources').select('*').order('created_at'),
      fetchAllApartments(),
    ]);
    setSources(src || []);
    setApartments(apts || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ── Añadir fuente ─────────────────────────────────────────────────────────
  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.apartment_slug || !form.url) {
      setError('Selecciona un apartamento e introduce la URL del calendario.');
      return;
    }
    if (!form.url.startsWith('http')) {
      setError('La URL debe empezar por http:// o https://');
      return;
    }
    setError('');
    setAdding(true);
    const { error: err } = await supabase
      .from('ical_sources')
      .insert({ apartment_slug: form.apartment_slug, url: form.url, platform: form.platform });
    if (err) {
      setError(err.message);
    } else {
      setForm({ apartment_slug: '', url: '', platform: 'booking' });
      await load();
    }
    setAdding(false);
  };

  // ── Eliminar fuente ───────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    await supabase.from('ical_sources').delete().eq('id', id);
    await supabase
      .from('reservations')
      .delete()
      .like('ical_uid', `${id}:%`);
    await load();
  };

  // ── Sincronizar una fuente ────────────────────────────────────────────────
  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-ical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      toast.error(`Error al sincronizar: ${err.message}`);
    }
    await load();
    setSyncing(null);
  };

  // ── Activar/Desactivar fuente ───────────────────────────────────────────
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error: err } = await supabase
      .from('ical_sources')
      .update({ active: !currentStatus })
      .eq('id', id);

    if (err) {
      toast.error(`Error al cambiar estado: ${err.message}`);
    } else {
      await load();
    }
  };

  // ── Sincronizar todo ──────────────────────────────────────────────────────
  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-ical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      alert(`Error al sincronizar: ${err.message}`);
    }
    await load();
    setSyncingAll(false);
  };

  const exportUrl = (slug: string) => {
    // Extraer ref de proyecto de VITE_SUPABASE_URL (ej: wzjonvdauwaispnjosaw)
    const ref = SUPABASE_URL.match(/https?:\/\/([^.]+)\./)?.[1];
    if (ref) {
      return `https://${ref}.functions.supabase.co/export-ical?slug=${slug}`;
    }
    // Fallback al gateway si no se puede extraer la ref
    return `${SUPABASE_URL}/functions/v1/export-ical?slug=${slug}`;
  };

  if (loading) {
    return (
      <div className="panel-page-content flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="panel-page-content space-y-5">
      <PanelPageHeader
        title="Sincronización iCal"
        subtitle="Importa reservas de Booking.com, Avaibook y Airbnb vía iCal para evitar dobles reservas."
        actions={
          sources.length > 0 ? (
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="panel-btn panel-btn-primary panel-btn-sm flex items-center gap-2"
            >
              <Ico
                d={paths.sync}
                size={14}
                color="white"
                className={syncingAll ? 'animate-spin' : ''}
              />
              {syncingAll ? 'Sincronizando…' : 'Sincronizar todo'}
            </button>
          ) : null
        }
      />

      {/* Guía multi-plataforma */}
      <div className="panel-card">
        <p className="panel-label mb-2">¿Dónde encuentro la URL iCal?</p>
        <div className="flex gap-2 mb-3">
          {(['booking', 'avaibook', 'airbnb'] as const).map(p => (
            <button
              key={p}
              onClick={() => setGuideTab(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${guideTab === p ? 'bg-teal-600 text-white border-teal-600' : 'border-[var(--panel-border)] panel-text-muted hover:border-teal-400'}`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
        {guideTab === 'booking' && (
          <ol className="list-decimal list-inside space-y-1 text-sm panel-text-muted">
            <li>Inicia sesión en la <strong className="panel-text-main">Extranet de Booking.com</strong></li>
            <li>Ve a <strong className="panel-text-main">Calendario → Sincronizar calendarios</strong></li>
            <li>Copia la URL del enlace <strong className="panel-text-main">"Exportar calendario"</strong> (.ics)</li>
          </ol>
        )}
        {guideTab === 'avaibook' && (
          <ol className="list-decimal list-inside space-y-1 text-sm panel-text-muted">
            <li>Inicia sesión en tu cuenta de <strong className="panel-text-main">Avaibook</strong></li>
            <li>Ve a <strong className="panel-text-main">Propiedades → Calendarios → Exportar</strong></li>
            <li>Copia la URL iCal (.ics) generada para el alojamiento</li>
          </ol>
        )}
        {guideTab === 'airbnb' && (
          <ol className="list-decimal list-inside space-y-1 text-sm panel-text-muted">
            <li>Inicia sesión en <strong className="panel-text-main">Airbnb</strong> como anfitrión</li>
            <li>Ve a <strong className="panel-text-main">Calendario → Disponibilidad → Exportar calendario</strong></li>
            <li>Copia el enlace <strong className="panel-text-main">"Exportar"</strong> (.ics) del alojamiento</li>
          </ol>
        )}
      </div>

      {/* Add new source */}
      <div className="panel-card">
        <h2 className="panel-h3 mb-4">Añadir calendario iCal</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
          <select
            value={form.platform}
            onChange={e => setForm(f => ({ ...f, platform: e.target.value as 'booking' | 'avaibook' | 'airbnb' }))}
            className="panel-input w-40"
            aria-label="Plataforma"
          >
            <option value="booking">Booking.com</option>
            <option value="avaibook">Avaibook</option>
            <option value="airbnb">Airbnb</option>
          </select>
          <select
            value={form.apartment_slug}
            onChange={e => setForm(f => ({ ...f, apartment_slug: e.target.value }))}
            className="panel-input w-44"
            aria-label="Apartamento"
          >
            <option value="">Apartamento…</option>
            {apartments.map(a => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="https://…ics"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            className="panel-input flex-1 min-w-64 w-auto"
          />
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-2 panel-btn panel-btn-primary disabled:opacity-50"
          >
            <Ico d={paths.plus} size={14} color="white" />
            {adding ? 'Añadiendo…' : 'Añadir'}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Sources list */}
      {sources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Ico d={paths.sync} size={32} color="#9ca3af" />
          <p className="mt-3 text-sm">No hay calendarios configurados todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(src => {
            const apt = apartments.find(a => a.slug === src.apartment_slug);
            const issyncing = syncing === src.id;
            const statusOk = src.last_status === 'ok';
            const statusErr = src.last_status === 'error';

            return (
              <div
                key={src.id}
                className={`panel-card transition-opacity ${src.active === false ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Estado */}
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          src.active === false
                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            : statusOk
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : statusErr
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${src.active === false ? 'bg-gray-300' : statusOk ? 'bg-green-500' : statusErr ? 'bg-red-500' : 'bg-gray-400'}`}
                        />
                        {src.active === false
                          ? 'Desactivado'
                          : statusOk
                            ? 'OK'
                            : statusErr
                              ? 'Error'
                              : 'Sin sincronizar'}
                      </span>
                      {src.platform && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[src.platform] ?? 'bg-gray-100 text-gray-500'}`}>
                          {PLATFORM_LABELS[src.platform] ?? src.platform}
                        </span>
                      )}
                      <span
                        className="text-sm font-semibold panel-text-main"
                      >
                        {apt?.name || src.apartment_slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-xs text-gray-400 truncate max-w-xs md:max-w-md lg:max-w-lg">
                        {src.url}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(src.url);
                          toast.success('URL copiada');
                        }}
                        title="Copiar URL"
                        className="shrink-0 p-1 text-gray-300 hover:text-teal-600 transition-colors"
                      >
                        <Ico d={paths.copy} size={12} color="currentColor" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>
                        Última sync: <strong>{timeAgo(src.last_sync ?? '')}</strong>
                      </span>
                      {src.last_message && (
                        <span className={statusErr ? 'text-red-500' : ''}>{src.last_message}</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(src.id, src.active !== false)}
                      title={
                        src.active === false
                          ? 'Activar sincronización'
                          : 'Desactivar sincronización'
                      }
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors border ${
                        src.active === false
                          ? 'border-[var(--panel-border)] opacity-60 hover:opacity-80'
                          : 'border-[var(--panel-border)] hover:opacity-80'
                      }`}
                    >
                      <Ico
                        d={src.active === false ? paths.check : paths.sync}
                        size={13}
                        color="currentColor"
                      />
                      {src.active === false ? 'Activar' : 'Desactivar'}
                    </button>
                    <button
                      onClick={() => handleSync(src.id)}
                      disabled={issyncing || src.active === false}
                      title="Sincronizar ahora"
                      className="flex items-center gap-1.5 text-xs border border-teal-600 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Ico
                        d={paths.sync}
                        size={13}
                        color="currentColor"
                        className={issyncing ? 'animate-spin' : ''}
                      />
                      {issyncing ? 'Sync…' : 'Sync'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: src.id, slug: src.apartment_slug })}
                      title="Eliminar"
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Ico d={paths.trash} size={15} color="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exportar calendarios propios */}
      <div className="panel-card">
        <h2 className="panel-h3 mb-1">Exportar calendarios propios</h2>
        <p className="text-xs text-gray-400 mb-4">
          Usa estas URLs en Booking.com, Avaibook o Airbnb para importar tus reservas directas y evitar huecos.
        </p>
        <div className="space-y-2">
          {apartments.map(apt => (
            <div key={apt.slug} className="flex items-center gap-3 text-sm">
              <span className="w-36 text-gray-700 dark:text-gray-300 font-medium shrink-0 truncate">
                {apt.name}
              </span>
              <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded truncate">
                {exportUrl(apt.slug)}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(exportUrl(apt.slug))}
                title="Copiar URL"
                className="shrink-0 p-1.5 text-gray-400 hover:text-teal-600 transition-colors"
              >
                <Ico d={paths.copy} size={14} color="currentColor" />
              </button>
              <a
                href={exportUrl(apt.slug)}
                target="_blank"
                rel="noopener noreferrer"
                title="Descargar .ics"
                className="shrink-0 p-1.5 text-gray-400 hover:text-teal-600 transition-colors"
              >
                <Ico d={paths.download} size={14} color="currentColor" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <PanelConfirm
        open={!!confirmDelete}
        variant="destructive"
        title="¿Eliminar esta fuente iCal?"
        description="Las reservas importadas vía iCal para este calendario también se eliminarán."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
