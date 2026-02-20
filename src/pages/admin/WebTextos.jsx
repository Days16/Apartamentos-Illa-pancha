import { useState, useEffect } from 'react';
import { fetchSettings, updateSetting, fetchWebsiteContent, updateWebsiteContent } from '../../services/supabaseService';

export default function WebTextos() {
  const [settings, setSettings] = useState({
    titleEs: '', titleEn: '',
    subtitleEs: '', subtitleEn: '',
    phone: '', email: '', address: '',
    metaEs: '', metaEn: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [siteSet, webContent] = await Promise.all([
        fetchSettings(),
        fetchWebsiteContent('home')
      ]);

      const newSettings = { ...settings };

      // Mapear site_settings a state
      if (siteSet) {
        if (siteSet.site_phone !== undefined) newSettings.phone = siteSet.site_phone;
        if (siteSet.site_email !== undefined) newSettings.email = siteSet.site_email;
        if (siteSet.site_address !== undefined) newSettings.address = siteSet.site_address;
      }

      // Mapear website_content a state
      webContent.forEach(c => {
        if (c.section_key === 'home_hero_title') {
          newSettings.titleEs = c.content_es || '';
          newSettings.titleEn = c.content_en || '';
        }
        if (c.section_key === 'home_hero_desc') {
          newSettings.subtitleEs = c.content_es || '';
          newSettings.subtitleEn = c.content_en || '';
        }
      });

      setSettings(newSettings);
      setLoading(false);
    }
    load();
  }, []);

  const up = (field) => (e) => setSettings(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      // Guardar site_settings
      await updateSetting('site_phone', settings.phone);
      await updateSetting('site_email', settings.email);
      await updateSetting('site_address', settings.address);

      // Guardar website_content
      await updateWebsiteContent('home_hero_title', { content_es: settings.titleEs, content_en: settings.titleEn });
      await updateWebsiteContent('home_hero_desc', { content_es: settings.subtitleEs, content_en: settings.subtitleEn });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving texts:', err);
      alert('Error al guardar los textos. Revisa la consola.');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Cargando datos...</div>;

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Textos de la web</div>
          <div className="main-sub">Modifica el contenido sin tocar código</div>
        </div>
      </div>

      <div className="main-body">
        <div className="card" style={{ padding: 32, maxWidth: 760, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 20 }}>
            Hero principal
          </div>
          <div className="form-row" style={{ marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-group-label">Título principal (ES)</label>
              <input className="form-control" value={settings.titleEs} onChange={up('titleEs')} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-group-label">Main title (EN)</label>
              <input className="form-control" value={settings.titleEn} onChange={up('titleEn')} />
            </div>
          </div>
          {[
            ['subtitleEs', 'Subtítulo (ES)'],
            ['subtitleEn', 'Subtitle (EN)'],
          ].map(([field, label]) => (
            <div key={field} className="form-group">
              <label className="form-group-label">{label}</label>
              <textarea
                className="form-control"
                style={{ minHeight: 60, resize: 'vertical' }}
                value={settings[field]}
                onChange={up(field)}
              />
            </div>
          ))}

          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', margin: '24px 0 16px' }}>
            Información de contacto
          </div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            {[
              ['phone', 'Teléfono'],
              ['email', 'Email de contacto'],
            ].map(([field, label]) => (
              <div key={field} className="form-group" style={{ margin: 0 }}>
                <label className="form-group-label">{label}</label>
                <input className="form-control" value={settings[field]} onChange={up(field)} />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-group-label">Dirección</label>
            <input className="form-control" value={settings.address} onChange={up('address')} />
          </div>

          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', margin: '24px 0 16px' }}>
            SEO
          </div>
          <div className="form-group">
            <label className="form-group-label">Meta descripción (ES) — máx. 160 caracteres</label>
            <textarea
              className="form-control"
              style={{ minHeight: 60, resize: 'none' }}
              value={settings.metaEs}
              onChange={up('metaEs')}
              placeholder="Reserva directo los mejores apartamentos en Ribadeo, Galicia. Sin comisiones. 8 apartamentos frente a la ría del Eo."
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group-label">Meta description (EN)</label>
            <textarea
              className="form-control"
              style={{ minHeight: 60, resize: 'none' }}
              value={settings.metaEn}
              onChange={up('metaEn')}
              placeholder="Book directly the best apartments in Ribadeo, Galicia. No commissions. 8 apartments overlooking the Eo estuary."
            />
          </div>
        </div>

        {saved && (
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '12px 20px', fontSize: 13, color: '#164e63', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 760 }}>
            ✓ Cambios guardados y publicados correctamente
          </div>
        )}
      </div>

      <div className="save-bar">
        <span className="save-bar-hint">Los cambios se publican en la web al guardar</span>
        <button className="action-btn" onClick={handleSave}>Guardar y publicar</button>
      </div>
    </>
  );
}
