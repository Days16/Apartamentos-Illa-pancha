import { useState, useEffect, useRef } from 'react';
import { fetchActiveOffers } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useDiscount } from '../contexts/DiscountContext';
import { useLocation } from 'react-router-dom';
import Ico, { paths } from './Ico';

export default function OffersBanner() {
    const [offers, setOffers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [closed, setClosed] = useState(false);
    const [copied, setCopied] = useState(false);
    const { lang, t } = useLang();
    const { activeDiscount, applyDiscount, removeDiscount } = useDiscount();
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/gestion');
    const bannerRef = useRef(null);

    useEffect(() => {
        fetchActiveOffers().then(data => {
            if (data && data.length > 0) {
                setOffers(data);

                // VALIDATION: If we have an active discount, check if it's still in the active list
                if (activeDiscount) {
                    const isValid = data.some(o => o.id === activeDiscount.id);
                    if (!isValid) {
                        removeDiscount();
                    }
                }
            } else {
                setOffers([]);
                // No active offers found, clear any applied discount
                if (activeDiscount) {
                    removeDiscount();
                }
            }
        });

        // Add keyframes for animation if not present
        if (!document.getElementById('banner-animations')) {
            const style = document.createElement('style');
            style.id = 'banner-animations';
            style.innerHTML = `
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(212, 168, 67, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0); }
        }
        .offer-slide {
          animation: slideUpFade 5s infinite;
        }
      `;
            document.head.appendChild(style);
        }
    }, [location.pathname]); // Re-fetch on navigation to ensure sync with DB

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    useEffect(() => {
        if (offers.length > 1 && !closed) {
            const interval = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % offers.length);
            }, 5000); // 5 seconds per offer
            return () => clearInterval(interval);
        }
    }, [offers.length, closed]);

    // Auto-apply if no code
    useEffect(() => {
        if (offers.length > 0) {
            const current = offers[currentIndex];
            if (!current.discount_code && activeDiscount?.id !== current.id) {
                applyDiscount(current);
            }
        }
    }, [currentIndex, offers, activeDiscount, applyDiscount]);

    // Layout synchronization
    useEffect(() => {
        const updateHeight = () => {
            if (offers.length > 0 && !closed && !isAdminPage) {
                const h = bannerRef.current?.offsetHeight || 48;
                document.documentElement.style.setProperty('--banner-height', `${h}px`);
            } else {
                document.documentElement.style.setProperty('--banner-height', '0px');
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('resize', updateHeight);
            document.documentElement.style.setProperty('--banner-height', '0px');
        };
    }, [offers.length, closed, isAdminPage]);

    // SEC: Clear discount when entering admin/gestion to avoid manual booking interference
    useEffect(() => {
        if (isAdminPage && activeDiscount) {
            removeDiscount();
        }
    }, [isAdminPage, activeDiscount, removeDiscount]);

    if (offers.length === 0 || closed || isAdminPage) return null;

    const offer = offers[currentIndex];
    const title = lang === 'es' || !offer.title_en ? offer.title_es : offer.title_en;



    const handleApplyDiscount = (off) => {
        applyDiscount(off);
        if (off.discount_code) {
            navigator.clipboard.writeText(off.discount_code);
            setCopied(true);
        }
    };

    return (
        <div
            ref={bannerRef}
            style={{
                background: 'linear-gradient(90deg, #0f172a 0%, #1a5f6e 100%)',
                color: '#fff',
                padding: '12px 48px',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '500',
                minHeight: '48px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>

            {/* Sliding Container */}
            <div
                key={currentIndex}
                className={offers.length > 1 ? 'offer-slide' : ''}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '16px',
                    width: '100%',
                    maxWidth: '1200px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: '#D4A843',
                        color: '#0f172a',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        <Ico d={paths.star} size={12} />
                        {t('OFERTA', 'OFFER')}
                    </div>

                    <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                        {title}
                    </span>

                    {offer.discount_percentage > 0 && (
                        <span style={{
                            color: '#D4A843',
                            fontWeight: 800,
                            fontSize: '16px'
                        }}>
                            -{offer.discount_percentage}%
                        </span>
                    )}
                </div>

                {!offer.discount_code && (
                    <div style={{
                        background: 'rgba(76, 175, 80, 0.2)',
                        border: '1px solid #4CAF50',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Ico d={paths.check} size={14} />
                        {t('DESCUENTO APLICADO', 'DISCOUNT APPLIED')}
                    </div>
                )}

                {offer.discount_code && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ opacity: 0.8, fontSize: '13px' }}>
                            {t('Usa el código:', 'Use code:')}
                        </span>
                        <button
                            onClick={() => handleApplyDiscount(offer)}
                            title={t('Aplicar y copiar código', 'Apply and copy code')}
                            style={{
                                background: activeDiscount?.id === offer.id ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                                border: `1px ${activeDiscount?.id === offer.id ? 'solid' : 'dashed'} rgba(255, 255, 255, 0.4)`,
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                animation: activeDiscount?.id === offer.id ? 'none' : 'pulseGlow 2s infinite'
                            }}
                            onMouseEnter={(e) => {
                                if (activeDiscount?.id !== offer.id) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.currentTarget.style.borderColor = '#fff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeDiscount?.id !== offer.id) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                }
                            }}
                        >
                            {offer.discount_code}
                            {activeDiscount?.id === offer.id ? (
                                <span style={{ color: '#fff' }}><Ico d={paths.check} size={14} /></span>
                            ) : (
                                <span style={{ opacity: 0.7 }}><Ico d={paths.copy} size={14} /></span>
                            )}
                        </button>
                        {copied && (
                            <span style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold', position: 'absolute', transform: 'translateY(-20px) translateX(200px)' }}>
                                {t('¡Copiado!', 'Copied!')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Dots */}
            {offers.length > 1 && (
                <div style={{ position: 'absolute', bottom: '4px', display: 'flex', gap: '4px' }}>
                    {offers.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: idx === currentIndex ? '#D4A843' : 'rgba(255, 255, 255, 0.3)',
                                transition: 'background 0.3s'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Close Button */}
            <button
                onClick={() => {
                    setClosed(true);
                    removeDiscount(); // User wants it removed if banner is gone
                }}
                style={{
                    position: 'absolute',
                    right: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = 0.6;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
            >
                <Ico d={paths.close} size={14} />
            </button>
        </div>
    );
}
