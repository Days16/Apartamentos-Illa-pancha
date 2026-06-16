import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  name: string;
  message: string;
  status: 'pending' | 'read' | 'replied';
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Enviado',
  read: 'Leído',
  replied: 'Respondido',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-emerald-100 text-emerald-700',
};

export default function PortalMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.email?.split('@')[0] ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, name, message, status, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) setMessages(data);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !name.trim()) return;
    setSending(true);
    setError('');
    try {
      const { error } = await supabase.from('messages').insert([{
        name: name.trim(),
        email: user?.email ?? '',
        message: text.trim(),
        status: 'pending',
      }]);
      if (error) throw error;
      setText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      loadMessages();
    } catch (err: any) {
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel-page-content">
      <div className="mb-6">
        <h1 className="font-serif text-2xl panel-text-main mb-1">Mensajes</h1>
        <p className="panel-text-muted text-sm">Escríbenos y te responderemos lo antes posible.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Formulario nuevo mensaje */}
        <div className="panel-card">
          <div className="panel-h3 mb-4">Nuevo mensaje</div>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label htmlFor="portal-name" className="panel-label mb-1.5">Tu nombre</label>
              <input
                id="portal-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="panel-input w-full"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="portal-msg" className="panel-label mb-1.5">Mensaje</label>
              <textarea
                id="portal-msg"
                value={text}
                onChange={e => setText(e.target.value)}
                required
                rows={4}
                className="panel-input w-full resize-none"
                placeholder="Escribe tu consulta…"
              />
            </div>
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}
            {sent && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Mensaje enviado correctamente.</div>
            )}
            <button
              type="submit"
              disabled={sending || !text.trim() || !name.trim()}
              className="panel-btn panel-btn-primary disabled:opacity-50"
            >
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div>
          <div className="panel-label mb-3">Historial</div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="panel-card animate-pulse h-20" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="panel-card text-center py-10">
              <div className="text-3xl mb-2">💬</div>
              <div className="panel-text-muted text-sm">No tienes mensajes todavía.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className="panel-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="text-xs panel-text-muted">
                      {new Date(m.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </div>
                  <p className="text-sm panel-text-main leading-relaxed whitespace-pre-line">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
