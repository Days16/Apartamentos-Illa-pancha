import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(() => {
    return localStorage.getItem('cookieConsent') !== null;
  });

  if (accepted) return null;

  const accept = (all) => {
    localStorage.setItem('cookieConsent', all ? 'all' : 'essential');
    setAccepted(true);
  };

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-text">
        Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico.{' '}
        <Link to="/cookies" className="cookie-banner-text a">Más información →</Link>
      </div>
      <div className="cookie-banner-actions">
        <button
          className="btn-outline"
          style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.55)', fontSize: 11 }}
          onClick={() => accept(false)}
        >
          Solo esenciales
        </button>
        <button
          style={{ background: '#D4A843', color: '#0f172a', border: 'none', padding: '9px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          onClick={() => accept(true)}
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}
