import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, User, Loader2, Rss } from "lucide-react";
import { fetchPosts, fetchPost } from "../../../services/blog";
import { useSeo } from "../../../lib/seo";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author?: { name: string } | null;
  published_at: string | null;
  image_url?: string | null;
}

// ── List view ───────────────────────────────────────────────────────────────

export function BlogPage() {
  useSeo({
    title: "Blog et conseils",
    description: "Conseils d'experts sur la qualité de l'eau, l'entretien des filtres et le choix d'une solution de traitement.",
    path: "/blog",
  });
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchPosts();
        if (!mounted) return;
        setPosts(res?.data ?? res ?? []);
      } catch {
        // silently fail — empty state handles it
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-[#0077BE] to-[#00A8E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Rss size={16} />
              Blog & Actualités
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Nos derniers articles
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Conseils, actualités et expertise sur le traitement de l'eau.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
              <span>Chargement des articles...</span>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16">
              <Rss size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Aucun article publié pour le moment.</p>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-100 dark:border-slate-700 cursor-pointer group transition-all hover:-translate-y-1"
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-[#0077BE]/20 to-[#00A8E8]/20 flex items-center justify-center">
                      <Rss size={40} className="text-[#0077BE]/40" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(post.published_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {post.author.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#0077BE] dark:group-hover:text-[#00A8E8] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{post.excerpt}</p>
                    )}
                    <span className="inline-block mt-4 text-sm font-semibold text-[#0077BE] dark:text-[#00A8E8] group-hover:underline">
                      Lire la suite →
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Detail view ─────────────────────────────────────────────────────────────

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo({
    title: post?.title ?? (notFound ? "Article introuvable" : "Blog"),
    description: (post as any)?.excerpt ?? undefined,
    image: (post as any)?.image_url ?? (post as any)?.cover_image ?? null,
    type: "article",
    noindex: notFound,
  });

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchPost(slug);
        if (!mounted) return;
        setPost(res?.data ?? res);
      } catch (err: any) {
        if (!mounted) return;
        if (err?.status === 404) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <span>Chargement de l'article...</span>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Article introuvable.</p>
        <button onClick={() => navigate("/blog")} className="text-[#0077BE] hover:underline font-semibold">
          ← Retour au blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero image */}
      {post.image_url && (
        <div className="w-full h-64 sm:h-96 overflow-hidden">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <button
          onClick={() => navigate("/blog")}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0077BE] mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Retour au blog
        </button>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          {post.author && (
            <span className="flex items-center gap-1">
              <User size={14} />
              {post.author.name}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
          {post.title}
        </h1>

        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 prose-a:text-[#0077BE]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
