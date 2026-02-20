import { useEffect, useState } from 'react';
import { fetchAllMessages, updateMessage } from '../../services/supabaseService';
import { sendContactReply } from '../../services/resendService';

export default function Mensajes() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? null : filter;
      const msgs = await fetchAllMessages(status);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await updateMessage(id, { status: 'read' });
      setMessages(m => m.map(msg => msg.id === id ? { ...msg, status: 'read' } : msg));
    } catch (err) {
      console.error('Error updating message:', err);
    }
  };

  const handleSelectMessage = async (msg) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      await handleMarkRead(msg.id);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) {
      setError('La respuesta no puede estar vacía');
      return;
    }

    try {
      // 1. Enviar el email por Resend
      await sendContactReply({
        guestEmail: selected.email,
        guestName: selected.name,
        subject: 'Re: Tu consulta en Illa Pancha Ribadeo',
        replyText: reply
      });

      // 2. Actualizar en Supabase
      await updateMessage(selected.id, {
        reply_content: reply,
        replied: true,
        reply_sent_at: new Date().toISOString(),
        status: 'replied'
      });

      setMessages(m => m.map(msg => msg.id === selected.id
        ? { ...msg, reply_content: reply, replied: true, status: 'replied' }
        : msg
      ));
      setSelected(prev => ({ ...prev, reply_content: reply, replied: true }));
      setReply('');
      setError('');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Error al enviar la respuesta por email o guardarla');
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (selected) {
    return (
      <>
        <div className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="action-btn action-btn-outline"
              style={{ padding: '6px 14px' }}
              onClick={() => setSelected(null)}
            >
              ← Volver
            </button>
            <div>
              <div className="main-title">{selected.name}</div>
              <div className="main-sub">{selected.email}</div>
            </div>
          </div>
        </div>
        <div className="main-body">
          <div className="card" style={{ padding: 32, maxWidth: 720 }}>
            {/* MENSAJE ORIGINAL */}
            <div style={{ background: '#f8fafc', padding: '20px 24px', marginBottom: 20, borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                {new Date(selected.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })} · {selected.email}
              </div>
              <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {selected.message}
              </div>
            </div>

            {/* RESPUESTA ANTERIOR */}
            {selected.replied && selected.reply_content && (
              <div style={{ background: '#e8f5e9', padding: '20px 24px', marginBottom: 20, borderLeft: '3px solid #4caf50', borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: '#1b5e20', marginBottom: 8, fontWeight: 600 }}>Tu respuesta</div>
                <div style={{ fontSize: 14, color: '#1b5e20', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {selected.reply_content}
                </div>
              </div>
            )}

            {/* RESPONDER */}
            {!selected.replied && (
              <>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 16 }}>
                  Responder
                </div>
                <textarea
                  className="form-control form-textarea"
                  placeholder="Escribe tu respuesta..."
                  rows={5}
                  value={reply}
                  onChange={e => { setReply(e.target.value); setError(''); }}
                  style={{ marginBottom: 12 }}
                />
                {error && <div style={{ fontSize: 12, color: '#d32f2f', marginBottom: 12 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="action-btn"
                    onClick={handleSendReply}
                  >
                    Enviar respuesta
                  </button>
                  <button
                    className="action-btn action-btn-outline"
                    onClick={() => setSelected(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Mensajes</div>
          <div className="main-sub">{unreadCount} sin leer</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'unread', 'replied'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={f === filter ? 'action-btn' : 'action-btn action-btn-outline'}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              {f === 'all' ? 'Todos' : f === 'unread' ? 'Sin leer' : 'Respondidos'}
            </button>
          ))}
        </div>
      </div>
      <div className="main-body">
        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Cargando...</div>
          ) : messages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              No hay mensajes
            </div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                className="table-row"
                style={{
                  gridTemplateColumns: '40px 1fr auto',
                  gap: 16,
                  background: m.status === 'unread' ? '#f8fafc' : '',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectMessage(m)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#f1f5f9', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#334155',
                  flexShrink: 0
                }}>
                  {m.name[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: m.status === 'unread' ? 600 : 400, color: '#0f172a' }}>
                      {m.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{m.email}</span>
                    {m.apartment_slug && <span className="badge badge-gray">{m.apartment_slug}</span>}
                    {m.status === 'unread' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                    {m.message}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                  {new Date(m.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
