
import { notFound } from 'next/navigation'
import { supabase } from '../lib/supabase'

async function getArticle(id: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, keyword, meta_title, meta_description, content, quality_score, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)
  if (!article) notFound()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

      <a href="/" style={{ fontSize: 14, color: '#8a8880', textDecoration: 'none' }}>
        ← Back to articles
      </a>

      <div style={{ marginTop: 32, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8a8880', fontFamily: 'monospace' }}>
          #{article.keyword}
        </span>
        {article.quality_score && (
          <span style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4',
            border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4 }}>
            ★ {article.quality_score}/100
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 600,
        lineHeight: 1.2, color: '#1a1916', marginBottom: 16, letterSpacing: '-0.5px' }}>
        {article.meta_title || article.keyword}
      </h1>

      {article.meta_description && (
        <p style={{ fontSize: 18, color: '#8a8880', lineHeight: 1.6,
          fontStyle: 'italic', marginBottom: 32, borderBottom: '1px solid #e8e5df', paddingBottom: 32 }}>
          {article.meta_description}
        </p>
      )}

      <div
        style={{ fontSize: 17, lineHeight: 1.8, color: '#3d3b35' }}
        dangerouslySetInnerHTML={{ __html: article.content || '<p>Content coming soon...</p>' }}
      />

      <style>{`
        div h1 { font-size: 28px; font-weight: 600; margin: 32px 0 12px; color: #1a1916; }
        div h2 { font-size: 22px; font-weight: 600; margin: 28px 0 10px; color: #1a1916; }
        div h3 { font-size: 18px; font-weight: 600; margin: 20px 0 8px; color: #1a1916; }
        div p  { margin-bottom: 18px; }
        div ul, div ol { padding-left: 24px; margin-bottom: 18px; }
        div li { margin-bottom: 6px; }
      `}</style>
    </div>
  )
}