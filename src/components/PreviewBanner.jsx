import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PreviewBanner() {
    const [active, setActive] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setActive(sessionStorage.getItem('maintenance_preview') === 'true');
    }, []);

    if (!active) return null;

    const handleExit = () => {
        sessionStorage.removeItem('maintenance_preview');
        window.location.href = '/admin/web';
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontFamily: "'Inter', sans-serif",
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>👁️</span>
                <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '0.02em' }}>
                    MODO VISTA PREVIA ACTIVO
                </span>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' }} />

            <button
                onClick={handleExit}
                style={{
                    background: '#b91c1c',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#991b1b'}
                onMouseOut={(e) => e.target.style.background = '#b91c1c'}
            >
                Salir y Volver al Panel
            </button>
        </div>
    );
}
