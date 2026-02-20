import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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
    <nav className="nav" style={{ boxShadow: scrolled ? '0 2px 20px rgba(15,23,42,0.08)' : 'none' }}>
      <Link to="/" className="nav-logo">Illa Pancha</Link>

      {/* Links - escritorio y menú móvil */}
      <div className={`nav-links${mobileOpen ? ' mobile-active' : ''}`}>
        <Link to="/apartamentos" className={`nav-link ${isActive('/apartamentos') ? 'active' : ''}`}>
          {T.nav.apartments}
        </Link>
        <Link to="/nosotros" className={`nav-link ${isActive('/nosotros') ? 'active' : ''}`}>
          {T.nav.ribadeo}
        </Link>
        <span className="nav-link" onClick={() => {
          setMobileOpen(false);
          if (location.pathname === '/nosotros') {
            document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
          } else {
            navigate('/nosotros');
            setTimeout(() => {
              document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
          }
        }}>
          {T.nav.experiences}
        </span>
        <Link to="/contacto" className={`nav-link ${isActive('/contacto') ? 'active' : ''}`}>
          {T.nav.contact}
        </Link>

        {/* Botón reservar visible también dentro del menú móvil */}
        <button className="btn-primary" onClick={handleBook} style={{ alignSelf: 'flex-start' }}>
          {T.nav.book}
        </button>
      </div>

      <div className="nav-actions">
        <button
          className={`nav-lang ${lang === 'ES' ? 'active' : ''}`}
          onClick={() => setLang('ES')}
        >ES</button>
        <span style={{ color: 'rgba(15,23,42,0.2)', fontSize: 11 }}>|</span>
        <button
          className={`nav-lang ${lang === 'EN' ? 'active' : ''}`}
          onClick={() => setLang('EN')}
        >EN</button>

        {/* Botón reservar - visible en escritorio */}
        <button className="btn-primary" onClick={handleBook} style={{ display: 'none' }} id="nav-book-desktop">
          {T.nav.book}
        </button>
        <button className="btn-primary nav-book-visible" onClick={handleBook}>
          {T.nav.book}
        </button>

        {/* Hamburger - solo visible en móvil */}
        <button
          className="hamburger"
          style={{ display: 'none' }}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menú"
        >
          <span style={{ transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : '' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : '' }} />
        </button>
      </div>
    </nav>
  );
}
