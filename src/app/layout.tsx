import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Robot Farm | Build Your Empire',
  description: 'Futuristic robot economy game. Build robots, mine resources, upgrade your fleet, and dominate the rankings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster theme="dark" position="bottom-right" richColors toastOptions={{ style: { background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', color: 'var(--text-bright)' } }} />
        {children}
      </body>
    </html>
  )
}
