import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getReservations, getApartmentBySlug, getExtras, markCashPaid, updateReservationStatus, deleteReservation, confirmAndMarkPaid } from '../../services/dataService';
import generateInvoice from '../../utils/generateInvoice';
import exportReservationsExcel from '../../utils/exportExcel';
import ManualBookingModal from '../../components/ManualBookingModal';

const COLORS = {
  blue: '#1a5f6e',
  gray: '#0f172a',
  yellow: '#D4A843',
  darkGray: '#0f172a',
  lightGray: '#f5f5f5',
  success: '#1a5f6e',
  warning: '#D4A843',
  error: '#C0392B',
};

const statusLabels = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
};

const statusBadgeColors = {
  confirmed: { bg: 'rgba(26,95,110, 0.1)', text: '#1a5f6e', border: 'rgba(26,95,110, 0.3)' },
  pending: { bg: 'rgba(212, 168, 67, 0.1)', text: '#D4A843', border: 'rgba(212, 168, 67, 0.3)' },
  cancelled: { bg: 'rgba(192, 57, 43, 0.1)', text: '#C0392B', border: 'rgba(192, 57, 43, 0.3)' },
};

const srcBadge = {
  web: ['Web Directa', '#1a5f6e'],
  booking: ['Booking.com', '#003580'],
  airbnb: ['Airbnb', '#FF5A5F'],
};

export default function Reservas() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [apartmentData, setApartmentData] = useState({});
  const [extrasData, setExtrasData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar reservas, apartamentos y extras
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar reservas
      const reservationsData = await getReservations();

      // Cargar extras
      const extrasResponse = await getExtras();
      setExtrasData(extrasResponse);

      // Cargar apartamentos para cada reserva
      const apartments = {};
      for (const res of reservationsData) {
        if (res.aptSlug && !apartments[res.aptSlug]) {
          const apt = await getApartmentBySlug(res.aptSlug);
          if (apt) {
            apartments[res.aptSlug] = apt;
          }
        }
      }
      setApartmentData(apartments);
      setReservations(reservationsData);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando reservas. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular días hasta check-in o desde check-out
  const getDaysInfo = (checkin, checkout) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Parsear formato "DD MMM" a fecha
      const checkInDate = parseStorageDate(checkin);
      const checkOutDate = parseStorageDate(checkout);

      if (!checkInDate || !checkOutDate) return null;

      const daysToCheckin = Math.floor((checkInDate - today) / (1000 * 60 * 60 * 24));
      const daysSinceCheckout = Math.floor((today - checkOutDate) / (1000 * 60 * 60 * 24));

      if (daysToCheckin > 0) {
        return { type: 'upcoming', days: daysToCheckin, text: `En ${daysToCheckin} día${daysToCheckin !== 1 ? 's' : ''}` };
      } else if (daysToCheckin === 0) {
        return { type: 'today', days: 0, text: 'Hoy' };
      } else if (daysSinceCheckout >= 0) {
        return { type: 'past', days: daysSinceCheckout, text: `Hace ${daysSinceCheckout} día${daysSinceCheckout !== 1 ? 's' : ''}` };
      }
    } catch (err) {
      console.error('Error parsing dates:', err);
    }
    return null;
  };

  const parseStorageDate = (dateStr) => {
    try {
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      };
      const parts = dateStr.trim().split(/\s+/);
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleMarkCashPaid = async (id) => {
    setSaving(true);
    try {
      const success = await markCashPaid(id);
      if (success) {
        const updated = reservations.map(r => r.id === id ? { ...r, cashPaid: true } : r);
        setReservations(updated);
        if (selectedId === id) {
          setSelectedReservation(updated.find(r => r.id === id));
        }
      } else {
        setError('Error marcando pago en efectivo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setSaving(true);
    try {
      const success = await updateReservationStatus(id, newStatus);
      if (success) {
        const updated = reservations.map(r => r.id === id ? { ...r, status: newStatus } : r);
        setReservations(updated);
        if (selectedId === id) {
          setSelectedReservation(updated.find(r => r.id === id));
        }
      } else {
        setError('Error actualizando estado.');
      }
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmAndMarkPaid = async (id) => {
    setSaving(true);
    try {
      const success = await confirmAndMarkPaid(id);
      if (success) {
        const updated = reservations.map(r => r.id === id ? { ...r, status: 'confirmed', cashPaid: true } : r);
        setReservations(updated);
        if (selectedId === id) {
          setSelectedReservation(updated.find(r => r.id === id));
        }
      } else {
        setError('Error al confirmar y marcar como pagado.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) return;

    setSaving(true);
    try {
      const success = await deleteReservation(id);
      if (success) {
        setReservations(prev => prev.filter(r => r.id !== id));
        setSelectedId(null);
        setSelectedReservation(null);
      } else {
        setError('Error al eliminar la reserva.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectReservation = (reservation) => {
    setSelectedId(reservation.id);
    setSelectedReservation(reservation);
  };

  const handleExportExcel = () => {
    exportReservationsExcel(filtered);
  };

  const handleGeneratePDF = () => {
    if (selectedReservation) {
      generateInvoice(selectedReservation);
    }
  };

  const filtered = reservations.filter(r => filter === 'all' || r.status === filter);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: COLORS.gray }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Cargando reservas...</div>
          <div style={{ fontSize: 12, color: '#999' }}>Conectando con Supabase...</div>
        </div>
      </div>
    );
  }

  if (error && !selectedId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: COLORS.error }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>⚠️ {error}</div>
          <button onClick={fetchData} style={{ padding: '8px 16px', background: COLORS.blue, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Vista de detalle
  if (selectedId && selectedReservation) {
    const apt = apartmentData[selectedReservation.aptSlug];
    const daysInfo = getDaysInfo(selectedReservation.checkin, selectedReservation.checkout);

    const getStatusOptions = () => {
      const current = selectedReservation.status;
      const options = ['pending', 'confirmed', 'cancelled'].filter(s => s !== current);
      return options;
    };

    return (
      <div style={{ background: '#fff' }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid #e0e0e0',
          padding: '24px',
          background: '#f9f9f9',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSelectedReservation(null);
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.blue}`,
                  color: COLORS.blue,
                  padding: '8px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ← Volver
              </button>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.gray, marginBottom: 4 }}>
                  Reserva {selectedReservation.id}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>{selectedReservation.guest}</div>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={handleGeneratePDF}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.blue}`,
                  color: COLORS.blue,
                  padding: '8px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ↓ PDF Factura
              </button>

              {selectedReservation.status === 'confirmed' && !selectedReservation.cashPaid && (
                <button
                  onClick={() => handleMarkCashPaid(selectedReservation.id)}
                  disabled={saving}
                  style={{
                    background: COLORS.success,
                    border: 'none',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? '⏳ Guardando...' : '✓ Marcar como pagado'}
                </button>
              )}

              {selectedReservation.status === 'pending' && (
                <button
                  onClick={() => handleConfirmAndMarkPaid(selectedReservation.id)}
                  disabled={saving}
                  style={{
                    background: COLORS.success,
                    border: 'none',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? '⏳ Procesando...' : '✓ Confirmar y Marcar Pagado'}
                </button>
              )}

              {getStatusOptions().length > 0 && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setConfirmAction(confirmAction ? null : 'changeStatus')}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${COLORS.yellow}`,
                      color: COLORS.yellow,
                      padding: '8px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Cambiar estado ▼
                  </button>
                  {confirmAction === 'changeStatus' && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'white',
                      border: `1px solid ${COLORS.yellow}`,
                      borderRadius: '4px',
                      marginTop: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 10,
                    }}>
                      {getStatusOptions().map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedReservation.id, status)}
                          disabled={saving}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            color: COLORS.gray,
                            opacity: saving ? 0.6 : 1,
                          }}
                        >
                          • {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleDeleteReservation(selectedReservation.id)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.error}`,
                  color: COLORS.error,
                  padding: '8px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? '⏳...' : '🗑 Eliminar'}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: 'rgba(192, 57, 43, 0.1)', border: `1px solid ${COLORS.error}`, color: COLORS.error, padding: '12px 16px', borderRadius: '4px', marginBottom: 16, fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Detalles de la reserva */}
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fafafa' }}>
              <div style={{ background: COLORS.blue, color: 'white', padding: '16px', fontSize: 14, fontWeight: 600 }}>
                Detalles de la reserva
              </div>
              <div style={{ padding: '16px' }}>
                {[
                  ['Referencia', selectedReservation.id],
                  ['Huésped', selectedReservation.guest],
                  ['Email', selectedReservation.email],
                  ['Teléfono', selectedReservation.phone],
                  ['Apartamento', apt?.name || selectedReservation.apt],
                  ['Check-in', selectedReservation.checkin],
                  ['Check-out', selectedReservation.checkout],
                  ['Noches', selectedReservation.nights],
                  ['Origen', srcBadge[selectedReservation.source]?.[0] || selectedReservation.source],
                ].map(([label, value], i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < 8 ? '1px solid #ddd' : 'none',
                    fontSize: 13,
                  }}>
                    <span style={{ color: '#666' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: COLORS.gray }}>{value}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  fontSize: 13,
                }}>
                  <span style={{ color: '#666' }}>Estado</span>
                  <div style={{
                    ...statusBadgeColors[selectedReservation.status],
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${statusBadgeColors[selectedReservation.status].border}`,
                  }}>
                    {statusLabels[selectedReservation.status]}
                  </div>
                </div>
                {daysInfo && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    fontSize: 13,
                    marginTop: 8,
                    paddingTop: '12px',
                    borderTop: '1px solid #ddd',
                  }}>
                    <span style={{ color: '#666' }}>Próximo evento</span>
                    <span style={{
                      fontWeight: 600,
                      color: daysInfo.type === 'upcoming' ? COLORS.blue : daysInfo.type === 'today' ? COLORS.warning : '#999',
                    }}>
                      {daysInfo.text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pagos */}
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fafafa' }}>
              <div style={{ background: COLORS.blue, color: 'white', padding: '16px', fontSize: 14, fontWeight: 600 }}>
                Resumen de pagos
              </div>
              <div style={{ padding: '16px' }}>
                {[
                  ['Total reserva', `${selectedReservation.total} €`],
                  ...(selectedReservation.extrasTotal > 0 ? [['Extras incluidos', `${selectedReservation.extrasTotal} €`]] : []),
                  ['Depósito (50%)', `${selectedReservation.deposit} € · ${selectedReservation.status === 'confirmed' ? '✓ Cobrado' : '---'}`],
                  ['Pago al llegar (50%)', `${selectedReservation.deposit} € · ${selectedReservation.cashPaid ? '✓ Recibido' : 'Pendiente'}`],
                ].map(([label, value], i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < 3 ? '1px solid #ddd' : 'none',
                    fontSize: 13,
                  }}>
                    <span style={{ color: '#666' }}>{label}</span>
                    <span style={{
                      fontWeight: 500,
                      color: value.includes('Cobrado') || value.includes('Recibido') ? COLORS.success : value.includes('Pendiente') ? COLORS.yellow : COLORS.gray,
                    }}>
                      {value}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  borderTop: '2px solid #ddd',
                  color: COLORS.gray,
                }}>
                  <span>Total cobrado</span>
                  <span>{selectedReservation.cashPaid || selectedReservation.status !== 'confirmed' ? selectedReservation.total : selectedReservation.deposit} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extras */}
          {selectedReservation.extras && selectedReservation.extras.length > 0 && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fafafa', marginBottom: 24, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.gray, marginBottom: 12 }}>
                Extras contratados
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedReservation.extras.map(extraId => {
                  const extra = extrasData.find(e => e.id === extraId);
                  return extra ? (
                    <div key={extraId} style={{
                      padding: '6px 12px',
                      background: 'rgba(26, 95, 110, 0.1)',
                      border: `1px solid ${COLORS.blue}`,
                      borderRadius: '4px',
                      fontSize: 12,
                      color: COLORS.blue,
                      fontWeight: 500,
                    }}>
                      {extra.name} {extra.price > 0 ? `· ${extra.price} €` : '· Gratis'}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Información del apartamento */}
          {apt && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fafafa', padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.gray, marginBottom: 12 }}>
                Apartamento
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
              }}>
                {[
                  ['Nombre', apt.name],
                  ['Capacidad', apt.cap],
                  ['Dormitorios', apt.beds],
                  ['Baños', apt.baths],
                  ['Precio/noche', `${apt.price} €`],
                  ['Estancia mínima', `${apt.minStay} noches`],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de lista
  return (
    <div style={{ background: '#fff' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #e0e0e0',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f9f9f9',
      }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.gray, marginBottom: 4 }}>Reservas</div>
          <div style={{ fontSize: 14, color: '#666' }}>{filtered.length} reserva{filtered.length !== 1 ? 's' : ''} {filter !== 'all' && `(${statusLabels[filter]})`}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#1a5f6e',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Nueva reserva manual
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            style={{
              background: COLORS.blue,
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              opacity: filtered.length === 0 ? 0.6 : 1,
            }}
          >
            ↓ Exportar Excel
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {error && (
          <div style={{ background: 'rgba(192, 57, 43, 0.1)', border: `1px solid ${COLORS.error}`, color: COLORS.error, padding: '12px 16px', borderRadius: '4px', marginBottom: 16, fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'confirmed', label: 'Confirmadas' },
            { id: 'cancelled', label: 'Canceladas' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 16px',
                background: filter === f.id ? COLORS.blue : 'transparent',
                color: filter === f.id ? 'white' : COLORS.gray,
                border: filter === f.id ? 'none' : `1px solid #ddd`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === f.id ? 600 : 500,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#999',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: COLORS.gray }}>
              No hay reservas
            </div>
            <div style={{ fontSize: 13 }}>
              {filter !== 'all' ? `No hay reservas ${statusLabels[filter].toLowerCase()}` : 'Carga un archivo o crea una reserva manual'}
            </div>
          </div>
        ) : (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'auto',
            background: '#fff',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}>
              <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: COLORS.gray }}>Ref.</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: COLORS.gray }}>Huésped</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: COLORS.gray }}>Apartamento</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: COLORS.gray }}>Fechas</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: COLORS.gray }}>Noches</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: COLORS.gray }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: COLORS.gray }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: COLORS.gray }}>Pago</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: COLORS.gray }}>Info</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const daysInfo = getDaysInfo(r.checkin, r.checkout);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        background: i % 2 === 0 ? '#fff' : '#f9f9f9',
                      }}
                      onClick={() => handleSelectReservation(r)}
                    >
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: '#999' }}>{r.id}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 500, color: COLORS.gray }}>{r.guest}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{r.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: COLORS.gray }}>{r.apt}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>
                        {r.checkin} → {r.checkout}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 500, color: COLORS.gray }}>{r.nights}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: COLORS.gray }}>{r.total} €</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{
                          ...statusBadgeColors[r.status],
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1px solid ${statusBadgeColors[r.status].border}`,
                          display: 'inline-block',
                        }}>
                          {statusLabels[r.status]}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {r.cashPaid ? (
                          <div style={{ color: COLORS.success, fontWeight: 600, fontSize: 12 }}>✓</div>
                        ) : r.status === 'confirmed' ? (
                          <div style={{ color: COLORS.yellow, fontWeight: 600, fontSize: 12 }}>50%</div>
                        ) : (
                          <div style={{ color: '#999', fontSize: 12 }}>—</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: COLORS.blue, fontSize: 12 }}>
                        {daysInfo ? (
                          <div style={{ fontWeight: 500 }}>{daysInfo.text}</div>
                        ) : (
                          <div style={{ color: '#999' }}>—</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ManualBookingModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newRes) => {
            setIsModalOpen(false);
            setReservations(prev => [newRes, ...prev]);
          }}
        />
      )}
    </div>
  );
}
