import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO Automation — Client Onboarding',
  description: 'Set up your automated SEO content pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
