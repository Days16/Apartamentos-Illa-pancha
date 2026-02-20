import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getApartments, createReservation, getReservations, normalizeReservation } from '../services/dataService';
import { formatPrice } from '../utils/format';
import Ico, { paths } from './Ico';

export default function ManualBookingModal({ onClose, onSuccess }) {
    const [apartments, setApartments] = useState([]);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', aptSlug: '',
        checkin: null, checkout: null, price: 0, deposit: 0,
        status: 'confirmed', source: 'manual'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        getApartments().then(apts => {
            setApartments(apts);
            if (apts.length > 0) {
                setForm(f => ({ ...f, aptSlug: apts[0].slug }));
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const errors = {};
            if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
            if (!form.checkin || !form.checkout) errors.dates = 'Las fechas son obligatorias';
            else if (form.checkout <= form.checkin) errors.dates = 'La salida debe ser después de la entrada';
            if (!form.price || form.price <= 0) errors.price = 'El precio debe ser mayor a 0';

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                setLoading(false);
                return;
            }

            const formatDate = (date) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
            const resId = 'IP-' + Math.floor(Math.random() * 900000 + 100000);
            const diffTime = Math.abs(form.checkout - form.checkin);
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const newReservation = {
                id: resId,
                guest_name: form.name,
                guest_email: form.email || 'manual@reservas.app',
                guest_phone: form.phone,
                apartment_slug: form.aptSlug,
                check_in: formatDate(form.checkin),
                check_out: formatDate(form.checkout),
                nights: nights,
                total_price: parseFloat(form.price),
                deposit_paid: parseFloat(form.deposit),
                status: form.status,
                source: form.source
            };

            const data = await createReservation({
                id: resId,
                guest: form.name,
                email: form.email || 'manual@reservas.app',
                phone: form.phone,
                aptSlug: form.aptSlug,
                checkin: formatDate(form.checkin),
                checkout: formatDate(form.checkout),
                nights: nights,
                total: parseFloat(form.price),
                deposit: parseFloat(form.deposit),
                status: form.status,
                source: form.source
            });

            onSuccess(data);
        } catch (err) {
            setError(err.message || 'Error al crear la reserva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="booking-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '20px 24px', background: '#1a5f6e', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>Nueva Reserva Manual</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <Ico d={paths.close} size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                    {error && <div style={{ background: '#fee', color: '#c00', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>{error}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Nombre del huésped *</label>
                            <input
                                className="form-input"
                                value={form.name}
                                onChange={e => {
                                    setForm(f => ({ ...f, name: e.target.value }));
                                    if (validationErrors.name) setValidationErrors(p => ({ ...p, name: null }));
                                }}
                                style={{ borderColor: validationErrors.name ? '#f44' : '#ddd' }}
                                required
                            />
                            {validationErrors.name && <div style={{ color: '#f44', fontSize: 10, marginTop: 4 }}>{validationErrors.name}</div>}
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Teléfono</label>
                            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>Email</label>
                        <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>Apartamento *</label>
                        <select className="form-input" value={form.aptSlug} onChange={e => setForm(f => ({ ...f, aptSlug: e.target.value }))}>
                            {apartments.map(a => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="form-label" style={{ fontSize: 12, color: validationErrors.dates ? '#f44' : 'inherit' }}>Fecha de Entrada *</label>
                            <DatePicker
                                selected={form.checkin}
                                onChange={d => {
                                    setForm(f => ({ ...f, checkin: d }));
                                    setValidationErrors(p => ({ ...p, dates: null }));
                                }}
                                dateFormat="dd/MM/yyyy"
                                className="form-input"
                                style={{ borderColor: validationErrors.dates ? '#f44' : '#ddd' }}
                                placeholderText="Entrada"
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: 12, color: validationErrors.dates ? '#f44' : 'inherit' }}>Fecha de Salida *</label>
                            <DatePicker
                                selected={form.checkout}
                                onChange={d => {
                                    setForm(f => ({ ...f, checkout: d }));
                                    setValidationErrors(p => ({ ...p, dates: null }));
                                }}
                                dateFormat="dd/MM/yyyy"
                                className="form-input"
                                style={{ borderColor: validationErrors.dates ? '#f44' : '#ddd' }}
                                placeholderText="Salida"
                                minDate={form.checkin}
                            />
                        </div>
                        {validationErrors.dates && <div style={{ color: '#f44', fontSize: 10, gridColumn: 'span 2' }}>{validationErrors.dates}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Precio Total *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                min="1"
                                value={form.price}
                                onChange={e => {
                                    setForm(f => ({ ...f, price: e.target.value }));
                                    if (validationErrors.price) setValidationErrors(p => ({ ...p, price: null }));
                                }}
                                style={{ borderColor: validationErrors.price ? '#f44' : '#ddd' }}
                                required
                            />
                            {validationErrors.price && <div style={{ color: '#f44', fontSize: 10, marginTop: 4 }}>{validationErrors.price}</div>}
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Depósito Pagado</label>
                            <input type="number" step="0.01" className="form-input" min="0" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Estado</label>
                            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                <option value="confirmed">Confirmada</option>
                                <option value="pending">Pendiente</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: 12 }}>Origen</label>
                            <select className="form-input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                                <option value="manual">Manual (Teléfono/Email)</option>
                                <option value="booking">Booking.com</option>
                                <option value="airbnb">Airbnb</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="action-btn action-btn-outline" style={{ padding: '8px 16px' }} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="action-btn" style={{ background: '#1a5f6e', color: 'white', padding: '8px 16px', border: 'none' }} disabled={loading}>
                            {loading ? 'Guardando...' : 'Crear Reserva'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
