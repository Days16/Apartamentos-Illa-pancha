import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Reservation {
  id: string;
  apt: string;
  apt_slug: string;
  checkin: string;
  checkout: string;
  nights: number;
  total: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PortalReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('id, apt, apt_slug, checkin, checkout, nights, total, deposit, status, source, created_at')
          .order('checkin', { ascending: false });
        if (!error && data) setReservations(data);
      } catch (err) {
        console.error('Error cargando reservas:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatPrice = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  return (
    <div className="panel-page-content">
      <div className="mb-6">
        <h1 className="font-serif text-2xl panel-text-main mb-1">Mis reservas</h1>
        <p className="panel-text-muted text-sm">Historial completo de tus estancias.</p>
      </div>

      {loading ? (
        <div className="panel-card !p-0 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b panel-border-color animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-40" />
                <div className="h-2.5 bg-slate-100 rounded w-56" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="panel-card text-center py-16">
          <div className="text-4xl mb-3">📅</div>
          <div className="panel-text-muted text-sm">No tienes reservas todavía.</div>
        </div>
      ) : (
        <div className="panel-card !p-0 overflow-hidden">
          {reservations.map((r, i) => (
            <div
              key={r.id}
              className={`px-6 py-4 border-b panel-border-color last:border-0 transition-colors hover:bg-slate-50/50 ${r.status === 'cancelled' ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold panel-text-main text-sm">{r.apt}</div>
                  <div className="text-xs panel-text-muted mt-0.5">
                    {formatDate(r.checkin)} → {formatDate(r.checkout)}
                    <span className="mx-1.5 opacity-40">·</span>
                    {r.nights} {r.nights === 1 ? 'noche' : 'noches'}
                  </div>
                  <div className="text-xs panel-text-muted mt-0.5">
                    Reservada el {new Date(r.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold panel-text-main text-sm">{formatPrice(r.total)}</div>
                    <div className="text-[11px] panel-text-muted">Señal: {formatPrice(r.deposit)}</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
