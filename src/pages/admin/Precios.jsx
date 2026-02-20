import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const PRIMARY_COLOR = '#1a5f6e';
const SECONDARY_COLOR = '#0f172a';
const LIGHT_BG = '#f5f5f5';

export default function Precios() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadApartments();
  }, []);

  const loadApartments = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('apartments')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setApartments(data || []);
    } catch (err) {
      console.error('Error loading apartments:', err);
      setError('Error al cargar apartamentos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Precios por temporada</div>
          <div className="main-sub">Los precios base y de temporada se gestionan por cada apartamento.</div>
        </div>
        <button className="action-btn" onClick={() => navigate('/admin')}>Ir a Apartamentos</button>
      </div>

      <div className="main-body">
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 20px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#0f172a', marginBottom: 6 }}>
            ¿Cómo gestionar los precios de temporada?
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
            Para ofrecer máxima flexibilidad, los precios de temporada (Alta, Baja, Festivos...) se configuran individualmente <b>dentro de la ficha de cada apartamento</b>. <br />
            Ve a la sección <strong>Apartamentos</strong>, haz clic en "Editar" sobre el apartamento que deseas modificar, y navega a la pestaña <strong>🗓️ Temporadas</strong>.
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 16 }}>
            Precios base actuales por apartamento
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando precios...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {apartments.map((a, i) => (
                <div key={i} style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {a.name}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: '#0f172a', fontWeight: 300 }}>
                    {a.price} €
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>por noche</div>

                  <button
                    onClick={() => navigate('/admin')}
                    style={{ background: 'transparent', border: `1px solid ${PRIMARY_COLOR}`, color: PRIMARY_COLOR, padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                  >
                    Manejar Temporadas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
