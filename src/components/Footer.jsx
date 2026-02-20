import { Link } from 'react-router-dom';
import Ico, { paths } from './Ico';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function Footer() {
  const { lang } = useLang();
  const T = useT(lang);
  const F = T.footer;

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

        <div>
          <div className="footer-col-title">{T.nav.apartments}</div>
          {['Cantábrico', 'Ribadeo', 'Illa Pancha', 'Eo', 'Castro'].map(name => (
            <Link key={name} to="/apartamentos" className="footer-link">Apt. {name}</Link>
          ))}
          <Link to="/apartamentos" className="footer-link">{T.home.viewAll}</Link>
        </div>

        <div>
          <div className="footer-col-title">{F.infoCol}</div>
          <Link to="/nosotros" className="footer-link">{F.about}</Link>
          <Link to="/contacto" className="footer-link">{F.contact}</Link>
          <Link to="/apartamentos" className="footer-link">{F.availability}</Link>
          <span className="footer-link">{F.howToGet}</span>
          <span className="footer-link">{F.faq}</span>
        </div>

        <div>
          <div className="footer-col-title">{F.bookOn}</div>
          <span className="footer-link">Booking.com ↗</span>
          <span className="footer-link">Airbnb ↗</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{F.rights}</span>
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
