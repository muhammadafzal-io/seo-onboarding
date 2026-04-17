import type { Metadata } from 'next'
import AnalyticsDashboard from './AnalyticsDashboard'


export const metadata: Metadata = {
  title: 'Analytics — SEO Swarm',
  description: 'Multi-client Google Analytics dashboard',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}