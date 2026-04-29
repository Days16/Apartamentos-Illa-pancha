import { useEffect, useMemo, useState } from 'react';
import { PanelPageHeader } from '../../components/panel';
import { fetchSettings, updateSetting } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import es from '../../i18n/locales/es.json';

type Poi = { t: string; d: string; photo: string };
type PoiConfig = { photos: string[]; mainPhoto: string };
type ExperiencesConfig = { marinaPoi: PoiConfig[]; asturiasPoi: PoiConfig[] };

const STORAGE_BUCKET = 'apartment-photos';

const buildDefaultConfig = (): ExperiencesConfig => {
  const marina = (es.experiences?.marinaPoi || []) as Poi[];
  const asturias = (es.experiences?.asturiasPoi || []) as Poi[];
  return {
    marinaPoi: marina.map(item => ({ photos: [item.photo], mainPhoto: item.photo })),
    asturiasPoi: asturias.map(item => ({ photos: [item.photo], mainPhoto: item.photo })),
  };
};

export default function ExperiencesAdmin() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ExperiencesConfig>(buildDefaultConfig());
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings()
      .then(settings => {
        const raw = settings.experiences_photos_config;
        if (typeof raw !== 'string' || !raw.trim()) return;
        const parsed = JSON.parse(raw) as ExperiencesConfig;
        if (parsed?.marinaPoi && parsed?.asturiasPoi) setConfig(parsed);
      })
      .catch(() => undefined);
  }, []);

  const sections = useMemo(
    () => [
      { key: 'marinaPoi' as const, title: 'Mariña Lucense', items: (es.experiences?.marinaPoi || []) as Poi[] },
      { key: 'asturiasPoi' as const, title: 'Occidente de Asturias', items: (es.experiences?.asturiasPoi || []) as Poi[] },
    ],
    []
  );

  const keyFor = (section: 'marinaPoi' | 'asturiasPoi', idx: number) => `${section}-${idx}`;

  const updatePoi = (
    section: 'marinaPoi' | 'asturiasPoi',
    idx: number,
    updater: (current: PoiConfig) => PoiConfig
  ) => {
    setConfig(prev => {
      const nextSection = [...prev[section]];
      nextSection[idx] = updater(nextSection[idx] || { photos: [], mainPhoto: '' });
      return { ...prev, [section]: nextSection };
    });
  };

  const addPhotoByUrl = (section: 'marinaPoi' | 'asturiasPoi', idx: number) => {
    const formKey = keyFor(section, idx);
    const url = (urlInputs[formKey] || '').trim();
    if (!url) return;
    updatePoi(section, idx, current => {
      if (current.photos.includes(url)) return current;
      const photos = [...current.photos, url];
      return { photos, mainPhoto: current.mainPhoto || url };
    });
    setUrlInputs(prev => ({ ...prev, [formKey]: '' }));
  };

  const addPhotoFile = async (
    section: 'marinaPoi' | 'asturiasPoi',
    idx: number,
    file: File | undefined
  ) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `experiences/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
    if (error) {
      toast.error('No se pudo subir la foto');
      return;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    updatePoi(section, idx, current => {
      const photos = [...current.photos, data.publicUrl];
      return { photos, mainPhoto: current.mainPhoto || data.publicUrl };
    });
  };

  const removePhoto = (section: 'marinaPoi' | 'asturiasPoi', idx: number, photo: string) => {
    updatePoi(section, idx, current => {
      const photos = current.photos.filter(p => p !== photo);
      return { photos, mainPhoto: current.mainPhoto === photo ? photos[0] || '' : current.mainPhoto };
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateSetting('experiences_photos_config', JSON.stringify(config), 'string');
      toast.success('Fotos de experiencias guardadas');
    } catch {
      toast.error('Error guardando las fotos de experiencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel-page-content">
      <PanelPageHeader
        title="Fotos de Experiencias"
        subtitle="Varias fotos por lugar y selección de principal"
        actions={
          <button className="panel-btn panel-btn-primary panel-btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        }
      />

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.key} className="panel-card">
            <h3 className="panel-h3 mb-4">{section.title}</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {section.items.map((item, idx) => {
                const poi = config[section.key][idx] || { photos: [item.photo], mainPhoto: item.photo };
                const formKey = keyFor(section.key, idx);
                return (
                  <div key={formKey} className="rounded-xl border p-4" style={{ borderColor: 'var(--panel-border)' }}>
                    <div className="text-sm font-semibold mb-2">{item.d}</div>
                    {poi.mainPhoto ? (
                      <img src={poi.mainPhoto} alt={item.d} className="w-full h-40 object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="w-full h-40 rounded-lg mb-3 bg-gray-100" />
                    )}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        className="panel-input"
                        placeholder="https://..."
                        value={urlInputs[formKey] || ''}
                        onChange={e => setUrlInputs(prev => ({ ...prev, [formKey]: e.target.value }))}
                      />
                      <button className="panel-btn panel-btn-ghost panel-btn-sm" onClick={() => addPhotoByUrl(section.key, idx)}>
                        Añadir URL
                      </button>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => addPhotoFile(section.key, idx, e.target.files?.[0])}
                      className="block text-xs mb-3"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {poi.photos.map(photo => (
                        <div key={photo} className="relative">
                          <img src={photo} alt={item.d} className="w-full h-16 object-cover rounded" />
                          <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1">
                            {poi.mainPhoto !== photo && (
                              <button
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white/90"
                                onClick={() => updatePoi(section.key, idx, current => ({ ...current, mainPhoto: photo }))}
                              >
                                Principal
                              </button>
                            )}
                            <button
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-100"
                              onClick={() => removePhoto(section.key, idx, photo)}
                            >
                              X
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
