import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { fetchWebsiteContent } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';

export default function About() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [texts, setTexts] = useState({});

  useEffect(() => {
    fetchWebsiteContent('about').then(data => {
      const cmap = {};
      data.forEach(item => cmap[item.section_key] = item);
      setTexts(cmap);
    });
  }, []);

  const getText = (key, defaultEs, defaultEn) => {
    if (!texts[key]) return t(defaultEs, defaultEn);
    return t(texts[key].content_es, texts[key].content_en);
  };

  return (
    <>
      <SEO
        title={t('Nosotros', 'About Us')}
        description={t('Conoce la historia de Illa Pancha y nuestro compromiso con el turismo de calidad en Ribadeo.', 'Learn about the history of Illa Pancha and our commitment to quality tourism in Ribadeo.')}
      />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="page-hero">
        <div className="page-hero-eyebrow">{t('Nuestra historia', 'Our story')}</div>
        <h1 className="page-hero-title" dangerouslySetInnerHTML={{ __html: getText('about_hero_title', 'Ribadeo, Galicia.<br /><em>En primera línea.</em>', 'Ribadeo, Galicia.<br /><em>On the front line.</em>') }} />
        <p className="page-hero-desc">
          {getText('about_hero_desc', 'Somos una familia ribadense con ocho apartamentos frente a la ría del Eo. Decidimos prescindir de intermediarios para ofrecerte un precio justo y un trato directo.', 'We are a local family with eight apartments facing the Eo estuary. We decided to do without intermediaries to offer you a fair price and direct treatment.')}
        </p>
      </div>

      {/* VALORES */}
      <div className="about-values">
        {[
          { icon: paths.cash, title: 'Sin comisiones', desc: 'Creemos que el dinero de tu reserva debe ir íntegro al alojamiento, no a una plataforma extranjera. Por eso ofrecemos reserva directa con precios siempre más bajos.' },
          { icon: paths.check, title: 'Trato personal', desc: 'Cuando reservas con nosotros, hablas directamente con nosotros. Nada de bots ni de tickets de soporte. Un número de teléfono real y una persona real al otro lado.' },
          { icon: paths.leaf, title: 'Calidad local', desc: 'Todos los apartamentos son propiedad de la familia y los mantenemos con el mismo cuidado que si fueran nuestra propia casa. Limpieza impecable, reformas constantes.' },
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
          <div className="about-story-title">
            Una historia de<br /><em>amor por Ribadeo</em>
          </div>
          <p className="about-story-text">
            Todo empezó con un único apartamento frente a la ría que mi abuelo rehabilitó en los años 80. Con el tiempo, la familia fue creciendo y también el número de pisos. Hoy son ocho, pero el espíritu es el mismo: ofrecer a los visitantes la misma experiencia auténtica que tenemos nosotros cuando miramos el Eo desde la ventana.
          </p>
          <p className="about-story-text">
            Ribadeo es un lugar especial. La ría, el puente internacional, la isla del faro, As Catedrais a 20 minutos. La luz de la tarde en verano pintando de dorado las aguas. El pulpo a feira en los chiringuitos del puerto. Queremos que lo experimentes como lo hacemos nosotros, y que no te cueste un ojo de la cara.
          </p>
          <p className="about-story-text">
            Llevamos años en Booking y Airbnb porque nos daban visibilidad. Pero nos hartamos de ver cómo cobraban entre un 15 y un 20% de comisión a nuestros huéspedes. Esta web es nuestra respuesta.
          </p>

          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">8</div>
              <div className="stat-label">Apartamentos</div>
            </div>
            <div className="stat">
              <div className="stat-value">+220</div>
              <div className="stat-label">Opiniones ★ 4.9</div>
            </div>
            <div className="stat">
              <div className="stat-value">0%</div>
              <div className="stat-label">Comisiones directas</div>
            </div>
          </div>
        </div>

        <div>
          <div className="about-story-img">
            <Ico d={paths.map} size={64} color="rgba(255,255,255,0.15)" />
          </div>
          <div style={{ marginTop: 16, padding: '20px 24px', background: '#f8fafc' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
              Dónde estamos
            </div>
            <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500, marginBottom: 4 }}>
              Ribadeo, Lugo · Galicia
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              En el extremo nororiental de Galicia, en la frontera con Asturias, al borde de la ría del Eo.
            </div>
          </div>
        </div>
      </div>

      {/* RIBADEO */}
      <div id="experiencias" style={{ background: '#0f172a', padding: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <div className="section-eyebrow" style={{ color: '#7dd3fc' }}>La zona</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, color: '#ffffff', lineHeight: 1.1, marginBottom: 24 }}>
              ¿Por qué Ribadeo?
            </div>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 16 }}>
              Ribadeo es la puerta de entrada a la Costa Verde gallega. A 20 minutos de las playas de As Catedrais, a 30 de Luarca y a 1 hora de Lugo. Un punto de partida perfecto para explorar la Mariña lucense.
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
              El casco histórico, el paseo marítimo, el puerto deportivo, los miradores sobre la ría, los mercados locales y los mejores restaurantes de marisco de la comarca están a pocos minutos a pie.
            </p>
          </div>
          <div>
            {[
              { t: '20 min', d: 'Playa de As Catedrais' },
              { t: '0 min', d: 'Centro histórico de Ribadeo' },
              { t: '5 min', d: 'Puente Internacional España-Portugal' },
              { t: '10 min', d: 'Isla Pancha (faro)' },
              { t: '30 min', d: 'Mondoñedo (ciudad episcopal)' },
              { t: '1h', d: 'Lugo (muralla romana)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#7dd3fc', fontWeight: 300, width: 56, flexShrink: 0 }}>
                  {item.t}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px', textAlign: 'center', background: '#f8fafc' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, fontWeight: 300, color: '#0f172a', marginBottom: 16, lineHeight: 1.1 }}>
          ¿Te animamos a <em>venir?</em>
        </div>
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
          Consulta la disponibilidad y reserva directamente. Sin comisiones, con trato personal y al mejor precio garantizado.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={() => setBookingOpen(true)}>
            Ver disponibilidad
          </button>
          <button className="btn-outline" style={{ padding: '14px 32px' }} onClick={() => navigate('/contacto')}>
            Contactar
          </button>
        </div>
      </div>

      <Footer />

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
