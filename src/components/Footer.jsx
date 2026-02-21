import { useState } from 'react';
import { Link } from 'react-router-dom';
import Ico, { paths } from './Ico';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function Footer() {
  const { lang } = useLang();
  const T = useT(lang);
  const F = T.footer;
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <span className="footer-logo">Illa Pancha</span>
          <p className="footer-tagline">{F.tagline}</p>
          <div className="footer-contact-item">
            <Ico d={paths.phone} size={13} color="rgba(255,255,255,0.4)" />
            <span>+34 982 XXX XXX</span>
          </div>
          <div className="footer-contact-item">
            <Ico d={paths.mail} size={13} color="rgba(255,255,255,0.4)" />
            <span>info@illapancha.com</span>
          </div>
          <div className="footer-contact-item">
            <Ico d={paths.map} size={13} color="rgba(255,255,255,0.4)" />
            <span>Ribadeo, Lugo, Galicia</span>
          </div>
        </div>

        {/* Apartments Section */}
        <div className="footer-col">
          <button
            className={`footer-col-title footer-col-toggle${expandedSection === 'apartments' ? ' expanded' : ''}`}
            onClick={() => toggleSection('apartments')}
            aria-expanded={expandedSection === 'apartments'}
          >
            {T.nav.apartments}
            <span className="footer-toggle-icon">+</span>
          </button>
          <div className={`footer-col-content${expandedSection === 'apartments' ? ' expanded' : ''}`}>
            {['Cantábrico', 'Ribadeo', 'Illa Pancha', 'Eo', 'Castro'].map(name => (
              <Link key={name} to="/apartamentos" className="footer-link">Apt. {name}</Link>
            ))}
            <Link to="/apartamentos" className="footer-link">{T.home.viewAll}</Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="footer-col">
          <button
            className={`footer-col-title footer-col-toggle${expandedSection === 'info' ? ' expanded' : ''}`}
            onClick={() => toggleSection('info')}
            aria-expanded={expandedSection === 'info'}
          >
            {F.infoCol}
            <span className="footer-toggle-icon">+</span>
          </button>
          <div className={`footer-col-content${expandedSection === 'info' ? ' expanded' : ''}`}>
            <Link to="/nosotros" className="footer-link">{F.about}</Link>
            <Link to="/contacto" className="footer-link">{F.contact}</Link>
            <Link to="/apartamentos" className="footer-link">{F.availability}</Link>
            <span className="footer-link">{F.howToGet}</span>
            <span className="footer-link">{F.faq}</span>
          </div>
        </div>

        {/* Book On Section */}
        <div className="footer-col">
          <button
            className={`footer-col-title footer-col-toggle${expandedSection === 'book' ? ' expanded' : ''}`}
            onClick={() => toggleSection('book')}
            aria-expanded={expandedSection === 'book'}
          >
            {F.bookOn}
            <span className="footer-toggle-icon">+</span>
          </button>
          <div className={`footer-col-content${expandedSection === 'book' ? ' expanded' : ''}`}>
            <span className="footer-link">Booking.com ↗</span>
            <span className="footer-link">Airbnb ↗</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-rights">{F.rights}</span>
        <div className="footer-legal">
          <Link to="/terminos">{F.terms}</Link>
          <Link to="/privacidad">{F.privacy}</Link>
          <Link to="/proteccion-datos">{F.dataProtection}</Link>
          <Link to="/cookies">{F.cookies}</Link>
        </div>
      </div>
    </footer>
  );
}
