import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';

export default function CookieBanner() {
  const { lang } = useLang();
  const T = useT(lang);
  const [accepted, setAccepted] = useState(() => {
    return localStorage.getItem('cookieConsent') !== null;
  });

  if (accepted) return null;

  const accept = (all: boolean) => {
    localStorage.setItem('cookieConsent', all ? 'all' : 'essential');
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-50 shadow-lg">
      <div className="text-sm leading-relaxed flex-1">
        {T.cookies.banner}{' '}
        <Link to="/cookies" className="text-gold hover:opacity-80 transition-opacity">
          {T.cookies.moreInfo} →
        </Link>
      </div>
      <div className="flex gap-3">
        <button
          className="border border-white/25 text-white/55 text-xs bg-transparent px-4 py-2 rounded hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => accept(false)}
        >
          {T.cookies.essential}
        </button>
        <button
          className="bg-gold text-navy border-0 px-5 py-2 text-xs font-bold tracking-widest uppercase cursor-pointer hover:opacity-90 transition-all"
          onClick={() => accept(true)}
        >
          {T.cookies.acceptAll}
        </button>
      </div>
    </div>
  );
}
