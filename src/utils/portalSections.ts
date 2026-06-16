import { paths } from '../components/Ico';

export interface PortalSection {
  id: string;
  label: string;
  path: string;
  icon: string;
}

export interface PortalSectionGroup {
  id: string;
  label: string;
  sections: PortalSection[];
}

export const PORTAL_SECTION_GROUPS: PortalSectionGroup[] = [
  {
    id: 'gestion',
    label: 'Panel de Gestión',
    sections: [
      { id: 'gestion_dashboard',   label: 'Dashboard',          path: '/portal/g/dashboard',   icon: paths.home },
      { id: 'gestion_reservas',    label: 'Reservas',           path: '/portal/g/reservas',    icon: paths.cal },
      { id: 'gestion_calendario',  label: 'Calendario',         path: '/portal/g/calendario',  icon: paths.building },
      { id: 'gestion_mensajes',    label: 'Mensajes',           path: '/portal/g/mensajes',    icon: paths.msg },
      { id: 'gestion_tareas',      label: 'Tareas',             path: '/portal/g/tareas',      icon: paths.check },
    ],
  },
  {
    id: 'admin_contenido',
    label: 'Admin — Contenido',
    sections: [
      { id: 'admin_apartamentos',  label: 'Apartamentos',       path: '/portal/a/apartamentos', icon: paths.building },
      { id: 'admin_ofertas',       label: 'Ofertas',            path: '/portal/a/ofertas',      icon: paths.star },
      { id: 'admin_extras',        label: 'Servicios extra',    path: '/portal/a/extras',       icon: paths.plus },
      { id: 'admin_resenas',       label: 'Reseñas',            path: '/portal/a/resenas',      icon: paths.msg },
      { id: 'admin_faq',           label: 'FAQ',                path: '/portal/a/faq',          icon: paths.check },
      { id: 'admin_blog',          label: 'Blog',               path: '/portal/a/blog',         icon: paths.edit },
      { id: 'admin_experiencias',  label: 'Experiencias',       path: '/portal/a/experiencias', icon: paths.photo },
      { id: 'admin_web',           label: 'Textos web',         path: '/portal/a/web',          icon: paths.edit },
    ],
  },
  {
    id: 'admin_config',
    label: 'Admin — Configuración',
    sections: [
      { id: 'admin_precios',       label: 'Precios dinámicos',  path: '/portal/a/precios',      icon: paths.tag },
      { id: 'admin_descuentos',    label: 'Descuentos',         path: '/portal/a/descuentos',   icon: paths.cash },
      { id: 'admin_reglas',        label: 'Reglas reserva',     path: '/portal/a/reglas',       icon: paths.cal },
      { id: 'admin_cancelacion',   label: 'Cancelaciones',      path: '/portal/a/cancelacion',  icon: paths.close },
      { id: 'admin_emails',        label: 'Emails automáticos', path: '/portal/a/emails',       icon: paths.mail },
      { id: 'admin_ical',          label: 'iCal sync',          path: '/portal/a/ical',         icon: paths.sync },
      { id: 'admin_registro',      label: 'Registro entrada',   path: '/portal/a/registro',     icon: paths.printer },
      { id: 'admin_pdf_editor',    label: 'Editor PDF',         path: '/portal/a/pdf-editor',   icon: paths.edit },
      { id: 'admin_configuracion', label: 'Ajustes generales',  path: '/portal/a/configuracion', icon: paths.settings },
    ],
  },
  {
    id: 'admin_sistema',
    label: 'Admin — Sistema',
    sections: [
      { id: 'admin_analytics',     label: 'Analíticas',         path: '/portal/a/analytics',   icon: paths.trend },
      { id: 'admin_auditoria',     label: 'Reg. auditoría',     path: '/portal/a/auditoria',   icon: paths.check },
      { id: 'admin_changelog',     label: 'Changelog',          path: '/portal/a/changelog',   icon: paths.download },
    ],
  },
  {
    id: 'portal_personal',
    label: 'Portal personal',
    sections: [
      { id: 'portal_checkin',      label: 'Info de check-in',   path: '/portal/checkin',       icon: paths.lock },
      { id: 'portal_facturas',     label: 'Facturas PDF',       path: '/portal/facturas',      icon: paths.download },
    ],
  },
];

export function getAllSections(): PortalSection[] {
  return PORTAL_SECTION_GROUPS.flatMap(g => g.sections);
}

export function getEnabledSectionIds(settings: Record<string, unknown>): string[] {
  const raw = settings.portal_user_sections as string;
  if (!raw) return ['gestion_dashboard', 'gestion_reservas', 'gestion_calendario'];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ['gestion_dashboard', 'gestion_reservas', 'gestion_calendario'];
  } catch {
    return ['gestion_dashboard', 'gestion_reservas', 'gestion_calendario'];
  }
}

export function getEnabledSections(settings: Record<string, unknown>): PortalSection[] {
  const ids = getEnabledSectionIds(settings);
  const all = getAllSections();
  return ids.map(id => all.find(s => s.id === id)).filter(Boolean) as PortalSection[];
}
