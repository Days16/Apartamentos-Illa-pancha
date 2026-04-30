import React, { useState, useRef } from 'react';
import {
  fetchAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogCover,
  autoTranslateFromBase,
} from '../../services/supabaseService';
import { useToast } from '../../contexts/ToastContext';
import type { DbBlogPost } from '../../types';
import { PanelPageHeader, PanelConfirm } from '../../components/panel';
import { usePanelData } from '../../hooks/usePanelData';

type BlogForm = {
  slug: string;
  title: string;
  title_en: string;
  title_fr: string;
  title_de: string;
  title_pt: string;
  excerpt: string;
  excerpt_en: string;
  excerpt_fr: string;
  excerpt_de: string;
  excerpt_pt: string;
  content: string;
  content_en: string;
  content_fr: string;
  content_de: string;
  content_pt: string;
  cover_url: string;
  cover_alt: string;
  cover_alt_en: string;
  cover_alt_fr: string;
  cover_alt_de: string;
  cover_alt_pt: string;
  tags: string;
  author: string;
  published_at: string;
  active: boolean;
};

const EMPTY: BlogForm = {
  slug: '',
  title: '',
  title_en: '',
  title_fr: '',
  title_de: '',
  title_pt: '',
  excerpt: '',
  excerpt_en: '',
  excerpt_fr: '',
  excerpt_de: '',
  excerpt_pt: '',
  content: '',
  content_en: '',
  content_fr: '',
  content_de: '',
  content_pt: '',
  cover_url: '',
  cover_alt: '',
  cover_alt_en: '',
  cover_alt_fr: '',
  cover_alt_de: '',
  cover_alt_pt: '',
  tags: '',
  author: '',
  published_at: '',
  active: true,
};

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t || null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type DeeplUiLang = 'EN' | 'FR' | 'DE' | 'PT';

function needsTranslation(field: string, source: string): boolean {
  const t = field.trim();
  return !t || t.toLowerCase() === source.toLowerCase();
}

async function applyAutoTranslations(f: BlogForm, force = false): Promise<BlogForm> {
  let next = { ...f };

  const fields: { src: string; keys: [keyof BlogForm, DeeplUiLang][] }[] = [
    {
      src: f.title.trim(),
      keys: [
        ['title_en', 'EN'],
        ['title_fr', 'FR'],
        ['title_de', 'DE'],
        ['title_pt', 'PT'],
      ],
    },
    {
      src: f.excerpt.trim(),
      keys: [
        ['excerpt_en', 'EN'],
        ['excerpt_fr', 'FR'],
        ['excerpt_de', 'DE'],
        ['excerpt_pt', 'PT'],
      ],
    },
    {
      src: f.cover_alt.trim(),
      keys: [
        ['cover_alt_en', 'EN'],
        ['cover_alt_fr', 'FR'],
        ['cover_alt_de', 'DE'],
        ['cover_alt_pt', 'PT'],
      ],
    },
  ];

  for (const { src, keys } of fields) {
    if (!src) continue;
    const targets = keys
      .filter(([k]) => force || needsTranslation(f[k] as string, src))
      .map(([, lang]) => lang);
    if (!targets.length) continue;
    try {
      const tr = await autoTranslateFromBase(src, 'ES', targets);
      for (const [k, lang] of keys) {
        if (tr[lang]) (next as Record<string, unknown>)[k as string] = tr[lang];
      }
    } catch {
      // fallo silencioso por campo
    }
  }

  return next;
}

function postStatus(p: DbBlogPost): { label: string; cls: string } {
  if (!p.active) return { label: 'Archivado', cls: 'border-slate-200 text-slate-500' };
  if (!p.published_at) return { label: 'Borrador', cls: 'border-amber-200 text-amber-700 bg-amber-50' };
  if (new Date(p.published_at) > new Date())
    return { label: 'Programado', cls: 'border-blue-200 text-blue-700 bg-blue-50' };
  return { label: 'Publicado', cls: 'border-emerald-200 text-emerald-800 bg-emerald-50' };
}

export default function BlogAdmin() {
  const toast = useToast();
  const {
    data: postsData,
    loading,
    reload,
  } = usePanelData<DbBlogPost[]>({ fetcher: fetchAllBlogPosts });
  const posts = postsData ?? [];

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationsDirty, setTranslationsDirty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const startNew = () => {
    setForm(EMPTY);
    setEditing('new');
    setError(null);
    setTranslationsDirty(false);
  };

  const startEdit = (post: DbBlogPost) => {
    setForm({
      slug: post.slug,
      title: post.title,
      title_en: post.title_en ?? '',
      title_fr: post.title_fr ?? '',
      title_de: post.title_de ?? '',
      title_pt: post.title_pt ?? '',
      excerpt: post.excerpt ?? '',
      excerpt_en: post.excerpt_en ?? '',
      excerpt_fr: post.excerpt_fr ?? '',
      excerpt_de: post.excerpt_de ?? '',
      excerpt_pt: post.excerpt_pt ?? '',
      content: post.content ?? '',
      content_en: post.content_en ?? '',
      content_fr: post.content_fr ?? '',
      content_de: post.content_de ?? '',
      content_pt: post.content_pt ?? '',
      cover_url: post.cover_url ?? '',
      cover_alt: post.cover_alt ?? '',
      cover_alt_en: post.cover_alt_en ?? '',
      cover_alt_fr: post.cover_alt_fr ?? '',
      cover_alt_de: post.cover_alt_de ?? '',
      cover_alt_pt: post.cover_alt_pt ?? '',
      tags: post.tags.join(', '),
      author: post.author ?? '',
      published_at: post.published_at
        ? post.published_at.slice(0, 16)
        : '',
      active: post.active,
    });
    setEditing(post.id);
    setError(null);
    setTranslationsDirty(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slug = form.slug.trim() || `blog-${Date.now()}`;
    setUploadingCover(true);
    try {
      const { publicUrl } = await uploadBlogCover(slug, file);
      setForm(p => ({ ...p, cover_url: publicUrl }));
      toast.success('Portada subida correctamente.');
    } catch (err) {
      toast.error('Error subiendo la portada: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFillTranslations = async () => {
    if (!form.title.trim()) {
      setError('Rellena primero el título en español.');
      return;
    }
    setTranslating(true);
    setError(null);
    try {
      const filled = await applyAutoTranslations(form, true);
      setForm(filled);
      toast.success('Traducciones generadas. Revísalas antes de guardar.');
    } catch (err) {
      toast.error('Error en la traducción: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('El título en español es obligatorio.');
      return;
    }
    if (!form.slug.trim()) {
      setError('El slug es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);

    let filled = { ...form };
    const needsAuto =
      !form.title_en.trim() || !form.title_fr.trim() || !form.title_de.trim() || !form.title_pt.trim();
    if (needsAuto) {
      toast.info('Traduciendo idiomas vacíos…');
      try {
        filled = await applyAutoTranslations(form);
        setForm(filled);
      } catch {
        toast.error('Traducción automática fallida. Guardando sin traducciones.');
      }
    }

    try {
      const tags = filled.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        slug: filled.slug.trim(),
        title: filled.title.trim(),
        title_en: trimOrNull(filled.title_en),
        title_fr: trimOrNull(filled.title_fr),
        title_de: trimOrNull(filled.title_de),
        title_pt: trimOrNull(filled.title_pt),
        excerpt: trimOrNull(filled.excerpt),
        excerpt_en: trimOrNull(filled.excerpt_en),
        excerpt_fr: trimOrNull(filled.excerpt_fr),
        excerpt_de: trimOrNull(filled.excerpt_de),
        excerpt_pt: trimOrNull(filled.excerpt_pt),
        content: trimOrNull(filled.content),
        content_en: trimOrNull(filled.content_en),
        content_fr: trimOrNull(filled.content_fr),
        content_de: trimOrNull(filled.content_de),
        content_pt: trimOrNull(filled.content_pt),
        cover_url: trimOrNull(filled.cover_url),
        cover_alt: trimOrNull(filled.cover_alt),
        cover_alt_en: trimOrNull(filled.cover_alt_en),
        cover_alt_fr: trimOrNull(filled.cover_alt_fr),
        cover_alt_de: trimOrNull(filled.cover_alt_de),
        cover_alt_pt: trimOrNull(filled.cover_alt_pt),
        tags,
        author: trimOrNull(filled.author),
        published_at: filled.published_at ? new Date(filled.published_at).toISOString() : null,
        active: filled.active,
      };

      if (editing === 'new') {
        await createBlogPost(payload as Parameters<typeof createBlogPost>[0]);
        toast.success('Post creado correctamente.');
      } else {
        await updateBlogPost(editing!, payload);
        toast.success('Post actualizado correctamente.');
      }
      setEditing(null);
      setTranslationsDirty(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error('Error guardando: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await deleteBlogPost(id);
      reload();
      toast.success('Post eliminado.');
    } catch (err) {
      toast.error('Error eliminando: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleToggleActive = async (post: DbBlogPost) => {
    await updateBlogPost(post.id, { active: !post.active });
    reload();
  };

  const f =
    (field: keyof BlogForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      if (field === 'title' && editing === 'new') {
        setForm(p => ({
          ...p,
          title: value as string,
          slug: slugify(value as string),
          title_en: '', title_fr: '', title_de: '', title_pt: '',
        }));
        setTranslationsDirty(true);
      } else if (['title', 'excerpt', 'content', 'cover_alt'].includes(field)) {
        setForm(p => ({ ...p, [field]: value }));
        if (field === 'title' || field === 'excerpt') setTranslationsDirty(true);
      } else {
        setForm(p => ({ ...p, [field]: value }));
      }
    };

  const inputCls = 'panel-input';
  const labelCls = 'panel-label mb-2';
  const hintCls = 'text-xs panel-text-muted mt-1.5 leading-relaxed';

  return (
    <div className="panel-page-content">
      <PanelPageHeader
        title="Blog"
        subtitle="Artículos públicos · visible en /blog"
        actions={
          <button
            type="button"
            onClick={startNew}
            className="panel-btn panel-btn-primary panel-btn-sm"
          >
            + Nuevo post
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {editing && (
        <div className="panel-card mb-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              {editing === 'new' ? 'Nuevo post' : 'Editar post'}
            </h2>
            <div className="mt-4 panel-info-box text-sm leading-relaxed space-y-2">
              <p className="font-medium text-slate-800">Cómo usar este formulario</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[13px]">
                <li>Rellena el bloque <strong>español</strong> (título, extracto, contenido).</li>
                <li>
                  Deja los otros idiomas vacíos y pulsa <em>Guardar</em> para traducción automática,
                  o usa el botón <em>Traducir campos vacíos</em>.
                </li>
                <li>Para publicar, introduce la fecha/hora en «Publicar el».</li>
              </ol>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 mt-2">
                El contenido se escribe como texto plano. Separa los párrafos con una línea en blanco.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* ─── METADATA ─────────────────────────────────────── */}
            <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-slate-800">Metadatos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls} htmlFor="blog-slug">
                    Slug (URL)
                  </label>
                  <input
                    id="blog-slug"
                    value={form.slug}
                    onChange={f('slug')}
                    className={inputCls}
                    placeholder="mi-articulo-ribadeo"
                    autoComplete="off"
                  />
                  <p className={hintCls}>URL: /blog/{form.slug || 'slug'}</p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="blog-author">
                    Autor
                  </label>
                  <input
                    id="blog-author"
                    value={form.author}
                    onChange={f('author')}
                    className={inputCls}
                    placeholder="Equipo Illa Pancha"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="blog-tags">
                    Etiquetas
                  </label>
                  <input
                    id="blog-tags"
                    value={form.tags}
                    onChange={f('tags')}
                    className={inputCls}
                    placeholder="Ribadeo, Viaje, Galicia"
                    autoComplete="off"
                  />
                  <p className={hintCls}>Separadas por comas.</p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="blog-published-at">
                    Publicar el (dejar vacío = borrador)
                  </label>
                  <input
                    id="blog-published-at"
                    type="datetime-local"
                    value={form.published_at}
                    onChange={f('published_at')}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Cover */}
              <div>
                <label className={labelCls}>Imagen de portada</label>
                {form.cover_url && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-h-40 w-full">
                    <img src={form.cover_url} alt="Portada" className="object-cover w-full h-40" />
                  </div>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="border border-[#1a5f6e]/40 text-[#1a5f6e] bg-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#1a5f6e]/5"
                  >
                    {uploadingCover ? 'Subiendo…' : 'Subir imagen'}
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <input
                    value={form.cover_url}
                    onChange={f('cover_url')}
                    className={`${inputCls} flex-1 min-w-[200px]`}
                    placeholder="O pega una URL externa"
                  />
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Alt de la portada (ES)</label>
                  <input
                    value={form.cover_alt}
                    onChange={f('cover_alt')}
                    className={inputCls}
                    placeholder="Vistas a la ría del Eo desde Ribadeo"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={f('active')}
                  className="rounded border-slate-300 text-[#1a5f6e] focus:ring-[#1a5f6e]"
                />
                <span className="text-sm text-slate-700">Post activo (si no está activo, no se muestra aunque tenga fecha de publicación)</span>
              </label>
            </section>

            {/* ─── ESPAÑOL (base) ───────────────────────────────── */}
            <section className="rounded-xl border-2 border-[#1a5f6e] bg-gradient-to-b from-[#1a5f6e]/[0.07] to-white px-5 py-6 sm:px-6 sm:py-7">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-[#1a5f6e]">Versión en español</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#1a5f6e] text-white px-2.5 py-1 rounded-md">
                  Base · obligatorio
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                El texto base para generar las demás traducciones.
              </p>
              <div className="space-y-6">
                <div>
                  <label className={labelCls} htmlFor="blog-title-es">Título</label>
                  <input
                    id="blog-title-es"
                    value={form.title}
                    onChange={f('title')}
                    className={inputCls}
                    placeholder="Guía para visitar As Catedrais desde Ribadeo"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="blog-excerpt-es">Extracto (resumen corto)</label>
                  <textarea
                    id="blog-excerpt-es"
                    value={form.excerpt}
                    onChange={f('excerpt')}
                    rows={3}
                    className={`${inputCls} resize-y min-h-[80px]`}
                    placeholder="Breve descripción que aparece en la lista del blog."
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="blog-content-es">Contenido</label>
                  <textarea
                    id="blog-content-es"
                    value={form.content}
                    onChange={f('content')}
                    rows={14}
                    className={`${inputCls} resize-y min-h-[280px] leading-relaxed font-mono text-sm`}
                    placeholder="Escribe el artículo completo. Separa los párrafos con una línea en blanco."
                  />
                  <p className={hintCls}>Separa párrafos con una línea en blanco. El contenido se muestra como texto formateado.</p>
                </div>
              </div>
            </section>

            {/* ─── TRADUCCIONES ─────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Traducciones</h3>
              <p className="text-xs text-slate-500 mb-5 max-w-2xl">
                Vacío = se rellena automáticamente desde el español al guardar.
              </p>
            </div>

            {(
              [
                ['en', 'English', 'title_en', 'excerpt_en', 'content_en', 'cover_alt_en'],
                ['fr', 'Français', 'title_fr', 'excerpt_fr', 'content_fr', 'cover_alt_fr'],
                ['de', 'Deutsch', 'title_de', 'excerpt_de', 'content_de', 'cover_alt_de'],
                ['pt', 'Português', 'title_pt', 'excerpt_pt', 'content_pt', 'cover_alt_pt'],
              ] as const
            ).map(([, label, tk, ek, ck, ak]) => (
              <section
                key={label}
                className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">{label}</h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Título en {label}</label>
                    <input
                      value={form[tk]}
                      onChange={f(tk)}
                      className={inputCls}
                      placeholder="Vacío = traducción automática"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Extracto en {label}</label>
                    <textarea
                      value={form[ek]}
                      onChange={f(ek)}
                      rows={3}
                      className={`${inputCls} resize-y min-h-[70px]`}
                      placeholder="Vacío = traducción automática"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Contenido en {label}</label>
                    <textarea
                      value={form[ck]}
                      onChange={f(ck)}
                      rows={8}
                      className={`${inputCls} resize-y min-h-[180px] font-mono text-sm`}
                      placeholder="Vacío = traducción automática"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Alt portada en {label}</label>
                    <input
                      value={form[ak]}
                      onChange={f(ak)}
                      className={inputCls}
                      placeholder="Vacío = traducción automática"
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>

          {translationsDirty && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>
                Has modificado el español. Las traducciones se regenerarán al{' '}
                <strong>Guardar</strong>, o usa el botón de abajo.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || translating}
              className="bg-[#1a5f6e] text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleFillTranslations}
              disabled={saving || translating}
              className="border border-[#1a5f6e]/40 text-[#1a5f6e] bg-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#1a5f6e]/5"
            >
              {translating ? 'Traduciendo…' : translationsDirty ? 'Traducir desde español' : 'Traducir campos vacíos'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 py-12 text-center">Cargando…</div>
      ) : posts.length === 0 ? (
        <div className="text-slate-400 py-12 text-center rounded-xl border border-dashed border-slate-200">
          No hay posts. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map(post => {
            const { label, cls } = postStatus(post);
            return (
              <li
                key={post.id}
                className={`bg-white border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4 ${
                  post.active ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-70'
                }`}
              >
                {post.cover_url && (
                  <img
                    src={post.cover_url}
                    alt={post.cover_alt ?? post.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-slate-100"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                  {post.excerpt && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{post.excerpt}</p>
                  )}
                  {post.tags.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      {post.tags.map(t => `#${t}`).join(' ')}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Traducciones:{' '}
                    {[
                      post.title_en && 'EN',
                      post.title_fr && 'FR',
                      post.title_de && 'DE',
                      post.title_pt && 'PT',
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1.5 rounded-lg border ${cls}`}>{label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(post)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    {post.active ? 'Archivar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(post.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PanelConfirm
        open={!!confirmDeleteId}
        variant="destructive"
        title="¿Eliminar este post?"
        description="Esta acción es permanente y no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
