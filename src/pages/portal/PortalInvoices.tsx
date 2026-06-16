import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Reservation {
  id: string;
  apt: string;
  apt_slug: string;
  guest: string;
  email: string;
  checkin: string;
  checkout: string;
  nights: number;
  total: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: string;
}

export default function PortalInvoices() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('id, apt, apt_slug, guest, email, checkin, checkout, nights, total, deposit, status, source')
          .neq('status', 'cancelled')
          .order('checkin', { ascending: false });
        if (!error && data) setReservations(data);
      } catch (err) {
        console.error('Error cargando facturas:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDownload(r: Reservation) {
    setDownloading(r.id);
    try {
      const { default: generateInvoice } = await import('../../utils/generateInvoice');
      await generateInvoice({
        id: r.id,
        source: r.source,
        guest_name: r.guest,
        guest_email: r.email,
        apartment_name: r.apt,
        apt_slug: r.apt_slug,
        checkin: r.checkin,
        checkout: r.checkout,
        nights: r.nights,
        total: r.total,
        deposit: r.deposit,
      });
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloading(null);
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatPrice = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  return (
    <div className="panel-page-content">
      <div className="mb-6">
        <h1 className="font-serif text-2xl panel-text-main mb-1">Mis facturas</h1>
        <p className="panel-text-muted text-sm">Descarga el documento PDF de cada reserva.</p>
      </div>

      {loading ? (
        <div className="panel-card !p-0 overflow-hidden">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b panel-border-color animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-40" />
                <div className="h-2.5 bg-slate-100 rounded w-56" />
              </div>
              <div className="h-8 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="panel-card text-center py-16">
          <div className="text-4xl mb-3">🧾</div>
          <div className="panel-text-muted text-sm">No hay facturas disponibles todavía.</div>
        </div>
      ) : (
        <div className="panel-card !p-0 overflow-hidden">
          {reservations.map(r => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 px-6 py-4 border-b panel-border-color last:border-0 hover:bg-slate-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="font-semibold panel-text-main text-sm">{r.apt}</div>
                <div className="text-xs panel-text-muted mt-0.5">
                  {formatDate(r.checkin)} → {formatDate(r.checkout)}
                  <span className="mx-1.5 opacity-40">·</span>
                  {r.nights} {r.nights === 1 ? 'noche' : 'noches'}
                </div>
              </div>
              <div className="font-bold panel-text-main text-sm shrink-0">{formatPrice(r.total)}</div>
              <button
                onClick={() => handleDownload(r)}
                disabled={downloading === r.id}
                className="panel-btn panel-btn-ghost panel-btn-sm shrink-0 disabled:opacity-50"
              >
                {downloading === r.id ? 'Generando…' : '↓ PDF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
