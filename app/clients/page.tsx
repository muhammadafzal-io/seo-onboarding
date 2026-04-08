// app/clients/page.tsx — server component
import { createClient } from '@supabase/supabase-js'
import ClientsClient from './ClientsClient'


export const revalidate = 0

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ClientsPage() {
  // Fetch all clients with article counts
  const { data: clients, error } = await sb
    .from('clients')
    .select(`
      id, name, email, domain, niche, tone, schedule,
      publish_platform, publish_url, notes, created_at, updated_at,
      articles (
        id, status
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[clients/page] fetch error:', error)
  }

  // Enrich each client with computed stats
  const enriched = (clients || []).map((c: any) => {
    const arts       = c.articles || []
    const total      = arts.length
    const published  = arts.filter((a: any) => a.status === 'published').length
    const inPipeline = arts.filter((a: any) => !['published','failed'].includes(a.status)).length
    const failed     = arts.filter((a: any) => a.status === 'failed').length
    return {
      ...c,
      articles: undefined,        // remove nested array
      stats: { total, published, inPipeline, failed },
    }
  })

  return <ClientsClient initialClients={enriched} />
}