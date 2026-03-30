import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { fetchFaqs } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function Faq() {
  const { lang } = useLang();
  const T = useT(lang);
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs(true)
      .then(data => setFaqs(data))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const getQ = (faq) => lang === 'EN' && faq.question_en ? faq.question_en : faq.question;
  const getA = (faq) => lang === 'EN' && faq.answer_en ? faq.answer_en : faq.answer;

  // JSON-LD schema FAQPage para SEO
  const jsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: getQ(faq),
      acceptedAnswer: { '@type': 'Answer', text: getA(faq) },
    })),
  } : null;

  return (
    <>
      <SEO
        title={lang === 'EN' ? 'FAQ — Illa Pancha Apartments' : 'Preguntas Frecuentes — Illa Pancha Apartamentos'}
        description={lang === 'EN' ? 'Answers to the most common questions about our apartments in Ribadeo.' : 'Respuestas a las preguntas más frecuentes sobre nuestros apartamentos en Ribadeo.'}
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-4">
          {lang === 'EN' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
        </h1>
        <p className="text-gray-500 mb-12">
          {lang === 'EN'
            ? 'Everything you need to know before your stay in Ribadeo.'
            : 'Todo lo que necesitas saber antes de tu estancia en Ribadeo.'}
        </p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-gray-400">{lang === 'EN' ? 'No questions yet.' : 'Próximamente.'}</p>
        ) : (
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {faqs.map(faq => (
              <div key={faq.id}>
                <button
                  className="w-full text-left flex justify-between items-center py-5 gap-4"
                  onClick={() => setOpen(open === faq.id ? null : faq.id)}
                  aria-expanded={open === faq.id}
                >
                  <span className="font-semibold text-navy">{getQ(faq)}</span>
                  <span className={`text-teal text-xl flex-shrink-0 transition-transform duration-200 ${open === faq.id ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open === faq.id && (
                  <div className="pb-5 text-gray-600 leading-relaxed text-sm">
                    {getA(faq)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
