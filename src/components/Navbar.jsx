import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function Navbar({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();
  const T = useT(lang);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileOpen && navRef.current && !navRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileOpen]);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleBook = () => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      document.getElementById('apartments-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/apartamentos');
    }
  };

  return (
    <nav 
      className="nav" 
      ref={navRef}
      style={{ boxShadow: scrolled ? '0 2px 20px rgba(15,23,42,0.08)' : 'none' }}
    >
      <Link to="/" className="nav-logo">Illa Pancha</Link>

      {/* Links - escritorio y menú móvil */}
      <div className={`nav-links${mobileOpen ? ' mobile-active' : ''}`}>
        <Link to="/apartamentos" className={`nav-link ${isActive('/apartamentos') ? 'active' : ''}`}>
          {T.nav.apartments}
        </Link>
        <Link to="/nosotros" className={`nav-link ${isActive('/nosotros') ? 'active' : ''}`}>
          {T.nav.ribadeo}
        </Link>
        <span 
          className="nav-link" 
          onClick={() => {
            setMobileOpen(false);
            if (location.pathname === '/nosotros') {
              document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate('/nosotros');
              setTimeout(() => {
                document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
              }, 500);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {T.nav.experiences}
        </span>
        <Link to="/contacto" className={`nav-link ${isActive('/contacto') ? 'active' : ''}`}>
          {T.nav.contact}
        </Link>

        {/* Botón reservar visible solo en el menú móvil */}
        <button className="btn-primary nav-book-in-menu" onClick={handleBook}>
          {T.nav.book}
        </button>
      </div>

      <div className="nav-actions">
        <button
          className={`nav-lang ${lang === 'ES' ? 'active' : ''}`}
          onClick={() => setLang('ES')}
          aria-label="Español"
        >ES</button>
        <span style={{ color: 'rgba(15,23,42,0.2)', fontSize: 11 }} aria-hidden="true">|</span>
        <button
          className={`nav-lang ${lang === 'EN' ? 'active' : ''}`}
          onClick={() => setLang('EN')}
          aria-label="English"
        >EN</button>

        <button 
          className="btn-primary nav-book-visible" 
          onClick={handleBook}
          aria-label={T.nav.book}
        >
          {T.nav.book}
        </button>

        {/* Hamburger - solo visible en móvil */}
        <button
          className={`hamburger${mobileOpen ? ' active' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
