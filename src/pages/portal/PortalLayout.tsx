import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import Ico, { paths } from '../../components/Ico';
import { PORTAL_SECTION_GROUPS, getEnabledSectionIds } from '../../utils/portalSections';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function PortalLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { dark, toggle } = useTheme();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [topbarShadow, setTopbarShadow] = useState(false);

  // Secciones: primero las del usuario (configuración individual), luego la plantilla global
  const userPortalSections = user?.app_metadata?.portal_sections as string[] | null;
  const enabledIds = userPortalSections && userPortalSections.length > 0
    ? userPortalSections
    : getEnabledSectionIds(settings);

  // Nav agrupado: solo los grupos que tienen alguna sección habilitada
  const visibleGroups = PORTAL_SECTION_GROUPS
    .map(g => ({ ...g, sections: g.sections.filter(s => enabledIds.includes(s.id)) }))
    .filter(g => g.sections.length > 0);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => setTopbarShadow(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSidebarOpen(false); setAvatarMenuOpen(false); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? 'U';

  const currentLabel =
    visibleGroups.flatMap(g => g.sections).find(s => isActive(s.path))?.label ?? 'Inicio';

  function SidebarContent() {
    return (
      <>
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
          {/* Inicio siempre visible */}
          <Link to="/portal" className={`panel-nav-item${location.pathname === '/portal' ? ' active' : ''}`}>
            <Ico d={paths.home} size={17} color="currentColor" />
            <span className="flex-1">Inicio</span>
          </Link>

          {/* Secciones habilitadas agrupadas */}
          {visibleGroups.map(group => (
            <div key={group.id} className="mt-4">
              <div className="panel-label px-2 mb-1">{group.label}</div>
              {group.sections.map(section => (
                <Link
                  key={section.id}
                  to={section.path}
                  className={`panel-nav-item${isActive(section.path) ? ' active' : ''}`}
                >
                  <Ico d={section.icon} size={17} color="currentColor" />
                  <span className="flex-1">{section.label}</span>
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-white/10">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="panel-nav-item">
              <Ico d={paths.eye} size={17} color="currentColor" />
              Ver web pública
            </Link>
          </div>
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-white/10 admin-sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white bg-emerald-600">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-tight truncate">Portal</div>
              <div className="text-xs truncate mt-0.5 text-slate-500">{user?.email ?? ''}</div>
            </div>
            <button onClick={toggle} aria-label={dark ? 'Modo claro' : 'Modo oscuro'} className="text-slate-400 hover:text-white p-1.5 flex-shrink-0 transition-colors rounded">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans panel-bg-color">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col flex-shrink-0 admin-sidebar">
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
          <Link to="/" target="_blank" rel="noopener noreferrer" className="block no-underline">
            <div className="font-serif font-bold text-white text-xl tracking-wide leading-tight">Illa Pancha</div>
            <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">Ribadeo · Galicia</div>
          </Link>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
              Portal de trabajo
            </span>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden admin-mobile-overlay" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 flex flex-col z-50 md:hidden transition-transform duration-300 ease-in-out admin-mobile-drawer ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Menú del portal">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="font-serif font-bold text-white text-lg tracking-wide">Illa Pancha</div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-emerald-900/40 text-emerald-400">Portal</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-2 transition-colors rounded min-w-[44px] min-h-[44px]" aria-label="Cerrar menú">
            <Ico d={paths.close} size={18} color="currentColor" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`flex-shrink-0 flex items-center gap-3 px-4 border-b transition-shadow duration-200 admin-topbar${topbarShadow ? ' shadow-[0_2px_8px_rgba(0,0,0,.08)]' : ''}`}>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg transition-colors panel-text-muted min-w-[44px] min-h-[44px]" aria-label="Abrir menú">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <div className="md:hidden font-serif font-bold text-lg panel-text-main">Illa Pancha</div>
          <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <span className="panel-text-muted">Portal</span>
            <span className="text-xs panel-text-subtle">›</span>
            <span className="font-medium panel-text-main">{currentLabel}</span>
          </nav>
          <div className="flex-1" />
          <div className="relative" ref={avatarMenuRef}>
            <button onClick={() => setAvatarMenuOpen(v => !v)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Menú de usuario" aria-expanded={avatarMenuOpen}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 bg-emerald-600">{avatarLetter}</div>
              <Ico d={paths.caret} size={14} color="var(--panel-text-muted)" />
            </button>
            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-xl border z-50 py-1 min-w-[200px] panel-animate-in admin-dropdown" role="menu">
                <div className="px-4 py-2.5 border-b panel-border-color">
                  <div className="text-xs font-semibold panel-text-main truncate">{user?.email ?? ''}</div>
                </div>
                <button onClick={() => { toggle(); setAvatarMenuOpen(false); }} className="panel-user-menu-item flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left transition-colors" role="menuitem">
                  {dark ? <SunIcon /> : <MoonIcon />}
                  {dark ? 'Modo claro' : 'Modo oscuro'}
                </button>
                <div className="border-t my-1 panel-border-color" />
                <button onClick={() => { logout(); setAvatarMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600" role="menuitem">
                  <Ico d={paths.lock} size={14} color="currentColor" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        <div ref={contentRef} className="flex-1 overflow-auto admin-content panel-bg-color panel-text-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
