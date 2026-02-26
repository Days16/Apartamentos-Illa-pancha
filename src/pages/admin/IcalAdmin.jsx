import { useState, useEffect } from 'react';
import { fetchApartments, fetchIcalChannels, updateIcalChannel } from '../../services/supabaseService';
import Ico, { paths } from '../../components/Ico';

export default function IcalAdmin() {
  const [apartments, setApartments] = useState([]);
  const [channels, setChannels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApartments().then(setApartments);
    fetchIcalChannels().then(setChannels);
  }, []);

  const getChannelUrl = (aptId, platform) => {
    const ch = channels.find(c => c.apartment_id === aptId && c.platform === platform);
    return ch ? ch.url : '';
  };

  const getChannelId = (aptId, platform) => {
    const ch = channels.find(c => c.apartment_id === aptId && c.platform === platform);
    return ch ? ch.id : `new-${aptId}-${platform}`;
  };

  const handleSave = async (aptId, platform) => {
    setSaving(true);
    const id = getChannelId(aptId, platform);
    try {
      const data = {
        id: id.startsWith('new-') ? null : id,
        apartment_id: aptId,
        platform: platform,
        url: editUrl
      };

      const savedChannel = await updateIcalChannel(data);
      if (savedChannel) {
        setChannels(prev => {
          const existing = prev.find(p => p.apartment_id === aptId && p.platform === platform);
          if (existing) {
            return prev.map(p => p.id === existing.id ? savedChannel : p);
          }
          return [...prev, savedChannel];
        });
      }
    } finally {
      setSaving(false);
      setEditingId(null);
      setEditUrl('');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between pb-6 mb-8 px-8 pt-8 border-b-2 border-gray-200">
        <div>
          <div className="text-2xl font-bold text-gray-800">Canales iCal</div>
          <div className="text-gray-500 text-sm mt-1">Gestiona la sincronización con Booking.com y Airbnb</div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {apartments.map((a, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded shrink-0" style={{ background: a.gradient || '#1a5f6e' }} />
              <div className="font-semibold text-sm text-slate-900">{a.name}</div>
            </div>

            <div className="grid grid-cols-[80px_1fr_60px_auto] items-center gap-4 py-3 border-b border-gray-100">
              <div className="font-medium text-[11px] tracking-wider uppercase text-[#1A4A8B]">Booking</div>
              {editingId === `${a.id}-booking` ? (
                <input
                  type="url"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  className="w-full text-xs p-1 border border-gray-300 rounded"
                  placeholder="https://..."
                />
              ) : (
                <div className="text-[11px] font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  {getChannelUrl(a.id, 'booking') || '— Sin configurar —'}
                </div>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider text-center ${getChannelUrl(a.id, 'booking') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {getChannelUrl(a.id, 'booking') ? 'OK' : 'Falta'}
              </span>
              {editingId === `${a.id}-booking` ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(a.id, 'booking')}
                    disabled={saving}
                    className="px-3 py-1 bg-teal text-white rounded hover:bg-teal-600 transition-colors text-xs font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(`${a.id}-booking`); setEditUrl(getChannelUrl(a.id, 'booking')); }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  {getChannelUrl(a.id, 'booking') ? 'Editar' : '+ Añadir'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-[80px_1fr_60px_auto] items-center gap-4 py-3">
              <div className="font-medium text-[11px] tracking-wider uppercase text-[#C0392B]">Airbnb</div>
              {editingId === `${a.id}-airbnb` ? (
                <input
                  type="url"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  className="w-full text-xs p-1 border border-gray-300 rounded"
                  placeholder="https://..."
                />
              ) : (
                <div className="text-[11px] font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  {getChannelUrl(a.id, 'airbnb') || '— Sin configurar —'}
                </div>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider text-center ${getChannelUrl(a.id, 'airbnb') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {getChannelUrl(a.id, 'airbnb') ? 'OK' : 'Falta'}
              </span>
              {editingId === `${a.id}-airbnb` ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(a.id, 'airbnb')}
                    disabled={saving}
                    className="px-3 py-1 bg-teal text-white rounded hover:bg-teal-600 transition-colors text-xs font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(`${a.id}-airbnb`); setEditUrl(getChannelUrl(a.id, 'airbnb')); }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  {getChannelUrl(a.id, 'airbnb') ? 'Editar' : '+ Añadir'}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* URLs de exportación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="font-serif text-xl text-slate-900 mb-2">
            URLs de exportación (tu web → plataformas)
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
            Copia estas URLs y pégalas en la configuración de sincronización de Booking.com y Airbnb para que reciban tus reservas directas.
          </p>
          {apartments.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="text-xs font-semibold w-[140px] shrink-0 text-slate-700">{a.name}</div>
              <div className="flex-1 text-[11px] font-mono bg-slate-50 px-2.5 py-1.5 text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap rounded">
                https://dwnpcdhcvavtngsifwob.supabase.co/functions/v1/export-ical?slug={a.slug}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(`https://dwnpcdhcvavtngsifwob.supabase.co/functions/v1/export-ical?slug=${a.slug}`)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium"
              >
                Copiar
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
