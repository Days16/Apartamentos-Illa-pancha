import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { fetchPublishedPostBySlug, fetchPublishedPosts } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT, ui } from '../i18n/translations';
import type { DbBlogPost, Lang } from '../types';

function pickField(
  post: DbBlogPost,
  lang: Lang,
  field: 'title' | 'excerpt' | 'content' | 'cover_alt'
): string {
  const es = (post[field] as string) ?? '';
  const en = post[`${field}_en` as keyof DbBlogPost] as string | null;
  const fr = post[`${field}_fr` as keyof DbBlogPost] as string | null;
  const de = post[`${field}_de` as keyof DbBlogPost] as string | null;
  const pt = post[`${field}_pt` as keyof DbBlogPost] as string | null;
  if (lang === 'ES') return es;
  if (lang === 'EN') return en?.trim() || es;
  if (lang === 'FR') return fr?.trim() || en?.trim() || es;
  if (lang === 'DE') return de?.trim() || en?.trim() || es;
  if (lang === 'PT') return pt?.trim() || en?.trim() || es;
  return es;
}

function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const locale =
    lang === 'EN' ? 'en-GB' : lang === 'FR' ? 'fr-FR' : lang === 'DE' ? 'de-DE' : lang === 'PT' ? 'pt-PT' : 'es-ES';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderContent(raw: string) {
  return raw
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map((p, i) => <p key={i}>{p.trim()}</p>);
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const T = useT(lang);
  const bp = T.blogPage ?? ui.ES.blogPage;
  const [post, setPost] = useState<DbBlogPost | null>(null);
  const [related, setRelated] = useState<DbBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPublishedPostBySlug(slug)
      .then(async data => {
        if (!data) {
          navigate('/blog', { replace: true });
          return;
        }
        setPost(data);
        if (data.tags.length > 0) {
          const all = await fetchPublishedPosts();
          setRelated(
            all
              .filter(p => p.id !== data.id && p.tags.some(t => data.tags.includes(t)))
              .slice(0, 3)
          );
        }
      })
      .catch(() => navigate('/blog', { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal" />
        </div>
      </>
    );
  }

  if (!post) return null;

  const title = pickField(post, lang, 'title');
  const excerpt = pickField(post, lang, 'excerpt');
  const content = pickField(post, lang, 'content');
  const coverAlt = pickField(post, lang, 'cover_alt') || title;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    image: post.cover_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@type': 'Organization', name: 'Illa Pancha' },
    publisher: {
      '@type': 'Organization',
      name: 'Illa Pancha',
      logo: { '@type': 'ImageObject', url: 'https://www.apartamentosillapancha.com/logo_color.png' },
    },
  };

  return (
    <>
      <SEO
        title={title}
        description={excerpt || undefined}
        ogImage={post.cover_url ?? undefined}
        ogType="article"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="blog-post-main">
        <div className="blog-post-container">
          <Link to="/blog" className="blog-post-back">
            {bp.back}
          </Link>

          <article className="blog-post-article">
            {post.tags.length > 0 && (
              <div className="blog-card-tags mb-4">
                {post.tags.map(tag => (
                  <span key={tag} className="blog-tag-pill">{tag}</span>
                ))}
              </div>
            )}

            <h1 className="blog-post-title">{title}</h1>

            <div className="blog-post-meta">
              {post.published_at && (
                <span>{bp.publishedOn} {formatDate(post.published_at, lang)}</span>
              )}
              {post.author && <span>{bp.by} {post.author}</span>}
            </div>

            {post.cover_url && (
              <div className="blog-post-cover">
                <img src={post.cover_url} alt={coverAlt} />
              </div>
            )}

            {content && (
              <div className="blog-post-content">
                {renderContent(content)}
              </div>
            )}
          </article>

          {related.length > 0 && (
            <section className="blog-related">
              <h2 className="blog-related-title">{bp.relatedPosts}</h2>
              <div className="blog-grid blog-grid--sm">
                {related.map(r => (
                  <Link key={r.id} to={`/blog/${r.slug}`} className="blog-card">
                    {r.cover_url && (
                      <div className="blog-card-cover">
                        <img src={r.cover_url} alt={pickField(r, lang, 'title')} loading="lazy" />
                      </div>
                    )}
                    <div className="blog-card-body">
                      <h3 className="blog-card-title">{pickField(r, lang, 'title')}</h3>
                      <span className="blog-read-more">{bp.readMore}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
