import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Ico, { paths } from '../components/Ico';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { fetchWebsiteContent } from '../services/supabaseService';
import { mapsUrl as MAPS_URL, mapsEmbedUrl as MAPS_EMBED } from '../constants/assets';

const ADDRESS_DEFAULT = 'Av. Rosalía de Castro 25, 27700 Ribadeo, Lugo';

const DEFAULTS = {
  car_es: 'Desde la A-8 (Autovía del Cantábrico), toma la salida Ribadeo. Sigue por la N-634 hasta el centro. Aparcamiento disponible en la zona.',
  car_en: 'From the A-8 motorway (Autovía del Cantábrico), take the Ribadeo exit. Follow the N-634 to the town centre. Parking available nearby.',
  bus_es: 'Bus ALSA desde Lugo, Oviedo y A Coruña con parada en Ribadeo. Estación de autobús a 15 minutos a pie de los apartamentos.',
  bus_en: 'ALSA buses from Lugo, Oviedo and A Coruña stop in Ribadeo. Bus station is a 15-minute walk from the apartments.',
  airport_es: 'Aeropuerto de Santiago de Compostela (SCQ) a 190 km. Aeropuerto de Asturias (OVD) a 115 km. Alquiler de coche recomendado.',
  airport_en: 'Santiago de Compostela Airport (SCQ) 190 km away. Asturias Airport (OVD) 115 km away. Car hire recommended.',
};

export default function ComoLlegar() {
  const { lang } = useLang();
  const T = useT(lang);
  const isEN = lang === 'EN';

  const [address, setAddress] = useState(ADDRESS_DEFAULT);
  const [content, setContent] = useState(DEFAULTS);

  useEffect(() => {
    fetchWebsiteContent()
      .then(rows => {
        const map: Record<string, { es: string; en: string }> = {};
        rows.forEach(r => {
          if (r.section_key.startsWith('directions_')) {
            map[r.section_key] = { es: r.content_es || '', en: r.content_en || '' };
          }
        });
        if (map['directions_address']?.es) setAddress(map['directions_address'].es);
        setContent({
          car_es: map['directions_car_text']?.es || DEFAULTS.car_es,
          car_en: map['directions_car_text']?.en || DEFAULTS.car_en,
          bus_es: map['directions_bus_text']?.es || DEFAULTS.bus_es,
          bus_en: map['directions_bus_text']?.en || DEFAULTS.bus_en,
          airport_es: map['directions_airport_text']?.es || DEFAULTS.airport_es,
          airport_en: map['directions_airport_text']?.en || DEFAULTS.airport_en,
        });
      })
      .catch(() => {});
  }, []);

  const info = [
    { icon: paths.parking, title: isEN ? 'By car' : 'En coche', text: isEN ? content.car_en : content.car_es },
    { icon: paths.map, title: isEN ? 'Public transport' : 'Transporte público', text: isEN ? content.bus_en : content.bus_es },
    { icon: paths.map, title: isEN ? 'Nearest airport' : 'Aeropuerto más cercano', text: isEN ? content.airport_en : content.airport_es },
  ];

  return (
    <>
      <SEO title={T.seo.comoLlegarTitle} description={T.seo.comoLlegarDesc} />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-4">
          {isEN ? 'How to get here' : 'Cómo llegar'}
        </h1>
        <p className="text-gray-500 mb-10">
          {isEN
            ? 'Illa Pancha Apartments are located right in the centre of Ribadeo, on the coast of Galicia.'
            : 'Los Apartamentos Illa Pancha están en el centro de Ribadeo, en la costa de Galicia.'}
        </p>

        {/* Dirección + enlace Google Maps */}
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 border border-gray-200 rounded-xl p-5 mb-10 hover:border-teal hover:bg-teal/5 transition-all group"
        >
          <div className="w-11 h-11 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
            <Ico d={paths.map} size={20} color="#1a5f6e" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-navy">{address}</div>
            <div className="text-sm text-teal mt-0.5">
              {isEN ? 'Open in Google Maps →' : 'Abrir en Google Maps →'}
            </div>
          </div>
        </a>

        {/* Mapa embebido */}
        <div
          className="rounded-xl overflow-hidden border border-gray-200 mb-12"
          style={{ height: 340 }}
        >
          <iframe
            title={isEN ? 'Location map' : 'Mapa de ubicación'}
            src={MAPS_EMBED}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Opciones de transporte */}
        <div className="space-y-5">
          {info.map((item, i) => (
            <div key={i} className="flex gap-4 p-5 border border-gray-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ico d={item.icon} size={18} color="#1a5f6e" />
              </div>
              <div>
                <div className="font-semibold text-navy mb-1">{item.title}</div>
                <div className="text-sm text-gray-600 leading-relaxed">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
