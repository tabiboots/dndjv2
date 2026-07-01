import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'dndj',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-gray-100">
      <body className="bg-gray-100">{children}</body>
    </html>
  )
}
