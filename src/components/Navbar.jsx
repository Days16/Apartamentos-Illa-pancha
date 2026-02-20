import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function Navbar({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang } = useLang();
  const T = useT(lang);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="nav" style={{ boxShadow: scrolled ? '0 2px 20px rgba(15,23,42,0.08)' : 'none' }}>
      <Link to="/" className="nav-logo">Illa Pancha</Link>

      <div className="nav-links">
        <Link to="/apartamentos" className={`nav-link ${isActive('/apartamentos') ? 'active' : ''}`}>
          {T.nav.apartments}
        </Link>
        <Link to="/nosotros" className={`nav-link ${isActive('/nosotros') ? 'active' : ''}`}>
          {T.nav.ribadeo}
        </Link>
        <span className="nav-link" onClick={() => {
          if (location.pathname === '/nosotros') {
            document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
          } else {
            navigate('/nosotros#experiencias');
            // Timeout para asegurar que la vista cargue antes de scrollear
            setTimeout(() => {
              document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}>
          {T.nav.experiences}
        </span>
        <Link to="/contacto" className={`nav-link ${isActive('/contacto') ? 'active' : ''}`}>
          {T.nav.contact}
        </Link>
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
        {onOpenBooking && (
          <button className="btn-primary" onClick={onOpenBooking}>
            {T.nav.book}
          </button>
        )}
      </div>
    </nav>
  );
}
