import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import {
  getApartments,
  updateReservation,
} from '../services/dataService';
import { useToast } from '../contexts/ToastContext';
import Ico, { paths } from './Ico';
import type { Reservation, Apartment } from '../types';

interface EditReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReservationModal({
  reservation,
  onClose,
  onSuccess,
}: EditReservationModalProps) {
  const toast = useToast();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [form, setForm] = useState({
    guest: reservation.guest,
    email: reservation.email,
    phone: reservation.phone || '',
    aptSlug: reservation.aptSlug,
    checkin: new Date(reservation.checkin + 'T00:00:00'),
    checkout: new Date(reservation.checkout + 'T00:00:00'),
    total: reservation.total,
    deposit: reservation.deposit,
    status: reservation.status,
    source: reservation.source,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getApartments().then(setApartments);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const diffTime = Math.abs(form.checkout.getTime() - form.checkin.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const selectedApt = apartments.find(a => a.slug === form.aptSlug);

      const success = await updateReservation(reservation.id, {
        guest: form.guest,
        email: form.email,
        phone: form.phone,
        aptSlug: form.aptSlug,
        apt: selectedApt?.internalName || selectedApt?.name || form.aptSlug,
        checkin: formatDate(form.checkin),
        checkout: formatDate(form.checkout),
        nights: nights,
        total: Number(form.total),
        deposit: Number(form.deposit),
        status: form.status as any,
        source: form.source as any,
      });

      if (success) {
        toast.success('Reserva actualizada correctamente');
        onSuccess();
        onClose();
      } else {
        toast.error('Error al actualizar la reserva');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-teal text-white flex justify-between items-center">
          <div className="text-lg font-bold">Modificar Reserva {reservation.id}</div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Ico d={paths.close} size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Nombre del huésped
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.guest}
                onChange={e => setForm(f => ({ ...f, guest: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Teléfono
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Apartamento
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              value={form.aptSlug}
              onChange={e => setForm(f => ({ ...f, aptSlug: e.target.value }))}
            >
              {apartments.map(a => (
                <option key={a.slug} value={a.slug}>
                  {a.internalName || a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Entrada
              </label>
              <DatePicker
                selected={form.checkin}
                onChange={(d: Date | null) => d && setForm(f => ({ ...f, checkin: d }))}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Salida
              </label>
              <DatePicker
                selected={form.checkout}
                onChange={(d: Date | null) => d && setForm(f => ({ ...f, checkout: d }))}
                dateFormat="dd/MM/yyyy"
                minDate={form.checkin}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Precio Total (€)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.total}
                onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Depósito Pagado (€)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.deposit}
                onChange={e => setForm(f => ({ ...f, deposit: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Origen
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value as any }))}
              >
                <option value="web">Web (Directa)</option>
                <option value="manual">Manual (Tel/Email)</option>
                <option value="booking">Booking.com</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal-700 shadow-lg shadow-teal/20 transition-all disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
