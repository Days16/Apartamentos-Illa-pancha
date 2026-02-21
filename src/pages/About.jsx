import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { fetchWebsiteContent } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { safeHtml } from '../utils/sanitize';

export default function About() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const T = useT(lang);
  const A = T.about;
  const [bookingOpen, setBookingOpen] = useState(false);
  const [texts, setTexts] = useState({});

  useEffect(() => {
    fetchWebsiteContent('about').then(data => {
      const cmap = {};
      data.forEach(item => cmap[item.section_key] = item);
      setTexts(cmap);
    });
  }, []);

  const getText = (key, defaultContent) => {
    if (!texts[key]) return defaultContent;
    return lang === 'ES' ? texts[key].content_es : texts[key].content_en;
  };

  return (
    <>
      <SEO
        title={A.title}
        description={T.seo.homeDesc}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="page-hero">
        <div className="page-hero-eyebrow">{A.history}</div>
        <h1 className="page-hero-title" dangerouslySetInnerHTML={safeHtml(getText('about_hero_title', A.heroTitle))} />
        <p className="page-hero-desc">
          {getText('about_hero_desc', A.heroDesc)}
        </p>
      </div>

      {/* VALORES */}
      <div className="about-values">
        {[
          { icon: paths.cash, title: A.stats.commissions, desc: A.ctaDesc },
          { icon: paths.check, title: A.title, desc: A.ctaDesc },
          { icon: paths.leaf, title: A.title, desc: A.ctaDesc },
        ].map((v, i) => (
          <div key={i} className="about-value">
            <div className="about-value-icon">
              <Ico d={v.icon} size={32} color="#1a5f6e" />
            </div>
            <div className="about-value-title">{v.title}</div>
            <p className="about-value-desc">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* HISTORIA */}
      <div className="about-story">
        <div>
          <div className="about-story-title" dangerouslySetInnerHTML={safeHtml(getText('about_story_title', A.storyTitle))} />
          <p className="about-story-text" style={{ fontFamily: "'Jost', sans-serif" }}>
            {getText('about_story_text_1', A.storyText1)}
          </p>
          <p className="about-story-text" style={{ fontFamily: "'Jost', sans-serif" }}>
            {A.storyText2}
          </p>
          <p className="about-story-text" style={{ fontFamily: "'Jost', sans-serif" }}>
            {A.storyText3}
          </p>

          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">8</div>
              <div className="stat-label">{A.stats.apts}</div>
            </div>
            <div className="stat">
              <div className="stat-value">+220</div>
              <div className="stat-label">{A.stats.reviews}</div>
            </div>
            <div className="stat">
              <div className="stat-value">0%</div>
              <div className="stat-label">{A.stats.commissions}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="about-story-img">
            <Ico d={paths.map} size={64} color="rgba(255,255,255,0.15)" />
          </div>
          <div style={{ marginTop: 16, padding: '20px 24px', background: '#f8fafc' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
              {A.location}
            </div>
            <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500, marginBottom: 4 }}>
              Ribadeo, Lugo · Galicia
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              {A.locationDetail}
            </div>
          </div>
        </div>
      </div>

      {/* RIBADEO */}
      <div id="experiencias" style={{ background: '#0f172a', padding: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <div className="section-eyebrow" style={{ color: '#7dd3fc' }}>{A.zone}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, marginBottom: 24 }}>
              {A.whyRibadeo}
            </div>
            <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 16, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ✦ {A.charmingView}
            </div>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 16 }}>
              {A.ribadeoDesc1}
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
              {A.ribadeoDesc2}
            </p>
          </div>
          <div>
            {(A.poi || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#7dd3fc', fontWeight: 300, width: 64, flexShrink: 0 }}>
                  {item.t}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: "'Jost', sans-serif" }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px', textAlign: 'center', background: '#f8fafc' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, fontWeight: 300, color: '#0f172a', marginBottom: 16, lineHeight: 1.1 }} dangerouslySetInnerHTML={safeHtml(A.ctaTitle)} />
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
          {A.ctaDesc}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={() => setBookingOpen(true)}>
            {T.home.availability}
          </button>
          <button className="btn-outline" style={{ padding: '14px 32px' }} onClick={() => navigate('/contacto')}>
            {A.ctaContact}
          </button>
        </div>
      </div>

      <Footer />

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
