import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Robot Farm | Build Your Empire',
  description: 'Futuristic robot economy game. Build robots, mine resources, upgrade your fleet, and dominate the rankings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
