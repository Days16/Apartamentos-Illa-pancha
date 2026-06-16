import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Ico from '../../components/Ico';
import { PORTAL_SECTION_GROUPS, getEnabledSectionIds } from '../../utils/portalSections';

export default function PortalDashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();

  // Secciones: primero las del usuario (configuración individual), luego la plantilla global
  const userPortalSections = user?.app_metadata?.portal_sections as string[] | null;
  const enabledIds = userPortalSections && userPortalSections.length > 0
    ? userPortalSections
    : getEnabledSectionIds(settings);
  const visibleGroups = PORTAL_SECTION_GROUPS
    .map(g => ({ ...g, sections: g.sections.filter(s => enabledIds.includes(s.id)) }))
    .filter(g => g.sections.length > 0);

  const totalEnabled = visibleGroups.reduce((acc, g) => acc + g.sections.length, 0);

  return (
    <div className="panel-page-content">
      <div className="mb-8">
        <h1 className="font-serif text-3xl panel-text-main mb-1">
          Hola, <em>{user?.email?.split('@')[0]}</em>
        </h1>
        <p className="panel-text-muted text-sm">
          Tienes acceso a {totalEnabled} {totalEnabled === 1 ? 'sección' : 'secciones'}.
        </p>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="panel-card text-center py-16">
          <div className="text-4xl mb-3">🔒</div>
          <div className="font-semibold panel-text-main mb-1">Sin secciones asignadas</div>
          <div className="panel-text-muted text-sm">El administrador aún no ha habilitado ninguna sección para tu cuenta.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map(group => (
            <div key={group.id}>
              <div className="panel-label mb-3">{group.label}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.sections.map(section => (
                  <Link
                    key={section.id}
                    to={section.path}
                    className="panel-card hover:border-teal-400 transition-colors no-underline group flex flex-col items-start gap-2 cursor-pointer"
                  >
                    <Ico d={section.icon} size={20} color="#1a5f6e" />
                    <div className="font-semibold panel-text-main text-sm group-hover:text-teal-600 transition-colors leading-tight">
                      {section.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
