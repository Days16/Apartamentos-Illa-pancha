import { useState, useEffect } from 'react';
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from '../../services/supabaseService';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { question: '', question_en: '', answer: '', answer_en: '', display_order: 0, active: true };

export default function FaqAdmin() {
  const toast = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | uuid
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchFaqs(false);
      setFaqs(data);
    } catch (err) {
      setError('Error cargando FAQs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const startNew = () => {
    setForm({ ...EMPTY, display_order: faqs.length });
    setEditing('new');
    setError(null);
  };

  const startEdit = (faq) => {
    setForm({ ...faq });
    setEditing(faq.id);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError('La pregunta y la respuesta (ES) son obligatorias.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing === 'new') {
        await createFaq(form);
      } else {
        await updateFaq(editing, form);
      }
      setEditing(null);
      toast.success('FAQ guardada correctamente');
      await load();
    } catch (err) {
      toast.error('Error guardando: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta FAQ?')) return;
    try {
      await deleteFaq(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      toast.error('Error eliminando: ' + err.message);
    }
  };

  const handleToggleActive = async (faq) => {
    await updateFaq(faq.id, { active: !faq.active });
    setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, active: !f.active } : f));
  };

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Preguntas Frecuentes (FAQ)</h1>
          <p className="text-sm text-gray-500 mt-1">Se muestran en <code>/faq</code> con schema JSON-LD para SEO</p>
        </div>
        <button
          onClick={startNew}
          className="bg-[#1a5f6e] text-white px-4 py-2 rounded font-semibold text-sm hover:bg-opacity-90"
        >
          + Nueva FAQ
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3 mb-4">{error}</div>}

      {/* Formulario de edición */}
      {editing && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">{editing === 'new' ? 'Nueva FAQ' : 'Editar FAQ'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pregunta (ES) *</label>
              <input value={form.question} onChange={f('question')} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pregunta (EN)</label>
              <input value={form.question_en || ''} onChange={f('question_en')} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Respuesta (ES) *</label>
              <textarea value={form.answer} onChange={f('answer')} rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Respuesta (EN)</label>
              <textarea value={form.answer_en || ''} onChange={f('answer_en')} rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Orden</label>
              <input type="number" value={form.display_order} onChange={f('display_order')} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="faq-active" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
              <label htmlFor="faq-active" className="text-sm text-slate-700">Activa (visible en la web)</label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving} className="bg-[#1a5f6e] text-white px-5 py-2 rounded font-semibold text-sm disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(null)} className="border border-gray-200 text-slate-700 px-5 py-2 rounded text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-gray-400 py-10 text-center">Cargando…</div>
      ) : faqs.length === 0 ? (
        <div className="text-gray-400 py-10 text-center">No hay FAQs todavía. Crea la primera.</div>
      ) : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className={`bg-white border rounded-lg px-5 py-4 flex items-start gap-4 ${faq.active ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}>
              <span className="text-xs font-mono text-gray-400 w-6 text-center mt-0.5">{faq.display_order}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm">{faq.question}</div>
                {faq.question_en && <div className="text-xs text-gray-400 mt-0.5">{faq.question_en}</div>}
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{faq.answer}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggleActive(faq)} className={`text-xs px-2 py-1 rounded border ${faq.active ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500'}`}>
                  {faq.active ? 'Activa' : 'Inactiva'}
                </button>
                <button onClick={() => startEdit(faq)} className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-slate-700">
                  Editar
                </button>
                <button onClick={() => handleDelete(faq.id)} className="text-xs px-3 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
