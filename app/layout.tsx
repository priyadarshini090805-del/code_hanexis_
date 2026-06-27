import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hanexis — AI Sales Intelligence',
  description: 'Enterprise-grade AI-driven lead generation, outreach automation, and sales intelligence platform.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" style={{ background: '#FFFDF9', color: '#242424' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
