import { useNavigate } from 'react-router-dom';

export default function Maintenance() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%'
            }}>
                {/* Un icono o ilustración elegante */}
                <div style={{
                    fontSize: '64px',
                    marginBottom: '24px',
                    color: '#fbbf24'
                }}>
                    🚧
                </div>

                <h1 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '48px',
                    color: '#0f172a',
                    marginBottom: '16px',
                    fontWeight: '500'
                }}>
                    Estamos mejorando para ti
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    marginBottom: '32px'
                }}>
                    Nuestra web se encuentra actualmente en mantenimiento.
                    Estamos realizando algunas actualizaciones técnicas para ofrecerte una mejor experiencia.
                    Estaremos de vuelta en muy poco tiempo.
                </p>

                <div style={{
                    height: '1px',
                    background: '#e2e8f0',
                    width: '80px',
                    margin: '0 auto 32px'
                }} />

                <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    marginBottom: '40px'
                }}>
                    Si necesitas contactar con nosotros urgentemente, puedes hacerlo en:<br />
                    <strong>hola@apartamentosrosaila.es</strong>
                </p>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: '#0f172a',
                        color: 'white',
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    Reintentar acceso
                </button>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '40px',
                fontSize: '12px',
                color: '#cbd5e1',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }}>
                © 2026 Apartamentos Rosaila · Ribadeo
            </div>
        </div>
    );
}
