import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { fetchPublishedPosts } from '../services/supabaseService';
import { useLang } from '../contexts/LangContext';
import { useT, ui } from '../i18n/translations';
import type { DbBlogPost, Lang } from '../types';

function pickField(post: DbBlogPost, lang: Lang, field: 'title' | 'excerpt'): string {
  const es = post[field] ?? '';
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

export default function Blog() {
  const { lang } = useLang();
  const T = useT(lang);
  const bp = T.blogPage ?? ui.ES.blogPage;
  const [posts, setPosts] = useState<DbBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedPosts()
      .then(data => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).sort();
  const filtered = activeTag ? posts.filter(p => p.tags.includes(activeTag)) : posts;

  const jsonLd =
    filtered.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog · Illa Pancha Ribadeo',
          blogPost: filtered.slice(0, 10).map(p => ({
            '@type': 'BlogPosting',
            headline: pickField(p, lang, 'title'),
            url: `https://www.apartamentosillapancha.com/blog/${p.slug}`,
            datePublished: p.published_at,
            image: p.cover_url,
          })),
        }
      : undefined;

  return (
    <>
      <SEO
        title={bp.seoTitle}
        description={bp.seoDesc}
        ogType="website"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="blog-main">
        <div className="blog-hero">
          <h1 className="blog-hero-title">{bp.title}</h1>
          <p className="blog-hero-subtitle">{bp.subtitle}</p>
        </div>

        {allTags.length > 0 && (
          <div className="blog-tags-bar">
            <button
              className={`blog-tag-btn${activeTag === null ? ' active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              {lang === 'EN' ? 'All' : lang === 'FR' ? 'Tous' : lang === 'DE' ? 'Alle' : lang === 'PT' ? 'Todos' : 'Todos'}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`blog-tag-btn${activeTag === tag ? ' active' : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="blog-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="blog-card-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="blog-empty">{bp.empty}</p>
        ) : (
          <div className="blog-grid">
            {filtered.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                {post.cover_url && (
                  <div className="blog-card-cover">
                    <img
                      src={post.cover_url}
                      alt={post.cover_alt ?? pickField(post, lang, 'title')}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="blog-card-body">
                  {post.tags.length > 0 && (
                    <div className="blog-card-tags">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="blog-tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}
                  <h2 className="blog-card-title">{pickField(post, lang, 'title')}</h2>
                  {post.excerpt && (
                    <p className="blog-card-excerpt">{pickField(post, lang, 'excerpt')}</p>
                  )}
                  <div className="blog-card-meta">
                    {post.published_at && (
                      <span className="blog-card-date">
                        {bp.publishedOn} {formatDate(post.published_at, lang)}
                      </span>
                    )}
                    {post.author && (
                      <span className="blog-card-author">
                        {bp.by} {post.author}
                      </span>
                    )}
                  </div>
                  <span className="blog-read-more">{bp.readMore}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
