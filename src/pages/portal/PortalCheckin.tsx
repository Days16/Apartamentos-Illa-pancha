import { useSettings } from '../../contexts/SettingsContext';

export default function PortalCheckin() {
  const { settings } = useSettings();

  const accessInfo    = (settings.checkin_access_info as string) || '';
  const houseRules    = (settings.checkin_house_rules as string) || '';
  const phone         = (settings.contact_phone as string) || '';
  const whatsapp      = (settings.contact_whatsapp as string) || '';
  const address       = (settings.property_address as string) || '';

  return (
    <div className="panel-page-content">
      <div className="mb-6">
        <h1 className="font-serif text-2xl panel-text-main mb-1">Check-in</h1>
        <p className="panel-text-muted text-sm">Toda la información que necesitas para tu llegada.</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Dirección */}
        {address && (
          <div className="panel-card">
            <div className="panel-label mb-2">Dirección</div>
            <p className="panel-text-main text-sm">{address}</p>
          </div>
        )}

        {/* Instrucciones de acceso */}
        <div className="panel-card">
          <div className="panel-label mb-2">Instrucciones de acceso</div>
          {accessInfo ? (
            <p className="panel-text-main text-sm leading-relaxed whitespace-pre-line">{accessInfo}</p>
          ) : (
            <p className="panel-text-muted text-sm">Las instrucciones de acceso se publicarán próximamente.</p>
          )}
        </div>

        {/* Normas */}
        {houseRules && (
          <div className="panel-card">
            <div className="panel-label mb-2">Normas del alojamiento</div>
            <p className="panel-text-main text-sm leading-relaxed whitespace-pre-line">{houseRules}</p>
          </div>
        )}

        {/* Contacto */}
        {(phone || whatsapp) && (
          <div className="panel-card">
            <div className="panel-label mb-3">Contacto directo</div>
            <div className="flex flex-wrap gap-3">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors no-underline"
                >
                  📞 {phone}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors no-underline"
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
