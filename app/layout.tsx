import type { Metadata } from 'next'
import { Nunito_Sans } from 'next/font/google'
import './globals.css'

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  axes: ['wdth', 'YTLC'],
})

export const metadata: Metadata = {
  title: 'dndj',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunito.variable} bg-gray-100`}>
      <body className="bg-gray-100 font-(family-name:--font-nunito)">{children}</body>
    </html>
  )
}
