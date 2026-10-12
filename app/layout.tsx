import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Klosmo Color Mapper',
  description: 'Mappa i colori del feed nokinstyle sui metafield Shopify',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased">
        <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-neutral-900 text-xs font-bold">K</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Klosmo Color Mapper</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  )
}
