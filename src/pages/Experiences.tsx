import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import Ico, { paths } from '../components/Ico';
import SEO from '../components/SEO';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { safeHtml } from '../utils/sanitize';
import { useSettings } from '../contexts/SettingsContext';

type Poi = { t: string; d: string; desc: string; photo: string };
type PoiConfig = { photos?: string[]; mainPhoto?: string };
type ExperiencesPhotosConfig = { marinaPoi?: PoiConfig[]; asturiasPoi?: PoiConfig[] };

export default function Experiences() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const T = useT(lang);
  const E = T.experiences;
  const { settings } = useSettings();
  const [bookingOpen, setBookingOpen] = useState(false);

  const photosConfigRaw = settings?.experiences_photos_config;
  let photosConfig: ExperiencesPhotosConfig = {};
  if (typeof photosConfigRaw === 'string') {
    try {
      photosConfig = JSON.parse(photosConfigRaw) as ExperiencesPhotosConfig;
    } catch {
      photosConfig = {};
    }
  }

  const marina: Poi[] = (E.marinaPoi || []).map((item, idx) => ({
    ...item,
    photo: photosConfig.marinaPoi?.[idx]?.mainPhoto || item.photo,
  }));
  const asturias: Poi[] = (E.asturiasPoi || []).map((item, idx) => ({
    ...item,
    photo: photosConfig.asturiasPoi?.[idx]?.mainPhoto || item.photo,
  }));

  return (
    <>
      <SEO title={T.seo.experiencesTitle} description={T.seo.experiencesDesc} />
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* HERO */}
      <div className="relative py-24 md:py-32 px-4 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1540111687571-22809dbdc8b4?auto=format&fit=crop&q=80&w=2000"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/70 to-navy/85" />
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div className="text-sm font-semibold text-teal-300 uppercase tracking-widest mb-4">
            {E.heroEyebrow}
          </div>
          <h1
            className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight"
            dangerouslySetInnerHTML={safeHtml(E.heroTitle)}
          />
          <p className="text-lg md:text-xl text-gray-100 leading-relaxed">{E.heroDesc}</p>
        </div>
      </div>

      {/* INTRO */}
      <div className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">{E.introText1}</p>
          <p className="text-lg text-gray-700 leading-relaxed">{E.introText2}</p>
        </div>
      </div>

      {/* MARIÑA LUCENSE */}
      <div className="py-20 px-4 bg-slate-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 text-teal text-xs font-bold uppercase tracking-widest mb-4">
              <Ico d={paths.map} size={14} color="#1a5f6e" />
              {E.galiciaTag}
            </div>
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-navy mb-4"
              dangerouslySetInnerHTML={safeHtml(E.marinaTitle)}
            />
            <div className="w-20 h-1 bg-teal mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-gray-600 text-lg">{E.marinaDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marina.map((item, i) => (
              <article
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left group flex flex-col"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={item.photo}
                    alt={item.d}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-navy text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {item.t}
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <h3 className="text-xl font-serif font-bold text-teal mb-2">{item.d}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* OCCIDENTE DE ASTURIAS */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A843]/15 text-[#a07f1d] text-xs font-bold uppercase tracking-widest mb-4">
              <Ico d={paths.map} size={14} color="#a07f1d" />
              {E.asturiasTag}
            </div>
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-navy mb-4"
              dangerouslySetInnerHTML={safeHtml(E.asturiasTitle)}
            />
            <div className="w-20 h-1 bg-[#D4A843] mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-gray-600 text-lg">{E.asturiasDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asturias.map((item, i) => (
              <article
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left group flex flex-col"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={item.photo}
                    alt={item.d}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-navy text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {item.t}
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <h3 className="text-xl font-serif font-bold text-[#a07f1d] mb-2">{item.d}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* MAPA INTERACTIVO */}
      <div className="py-20 px-4 bg-slate-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">
              {E.mapEyebrow}
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-4">
              {E.mapTitle}
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">{E.mapDesc}</p>
          </div>
          <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white">
            <iframe
              src="https://maps.google.com/maps?q=Ribadeo,Lugo,Galicia&z=9&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de Ribadeo y alrededores"
            />
          </div>
          <div className="text-center mt-6">
            <a
              href="https://www.google.com/maps/search/Ribadeo,+Galicia/@43.55,-7.0,10z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal hover:text-teal-700 font-semibold text-sm"
            >
              {T.common.openMaps}
            </a>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 px-4 bg-navy text-center">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
            dangerouslySetInnerHTML={safeHtml(E.ctaTitle)}
          />
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">{E.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              className="w-full sm:w-auto px-8 py-4 bg-teal text-white hover:bg-teal-600 font-medium rounded transition-colors text-lg"
              onClick={() =>
                settings?.booking_mode === 'redirect' ? navigate('/reservar') : setBookingOpen(true)
              }
            >
              {T.home.availability}
            </button>
            <button
              className="w-full sm:w-auto px-8 py-4 border-2 border-white/30 text-white hover:bg-white hover:text-navy font-medium rounded transition-colors text-lg"
              onClick={() => navigate('/contacto')}
            >
              {E.ctaContact}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
