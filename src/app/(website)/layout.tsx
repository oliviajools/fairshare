'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { href: '/site', label: 'Start' },
  { href: '/site/about', label: 'Über TeamPayer' },
  { href: '/site/team', label: 'Wer wir sind' },
  { href: '/site/target', label: 'Für wen' },
  { href: '/site/features', label: 'Was wir bieten' },
  { href: '/site/contact', label: 'Kontakt' },
]

function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/site" className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <span className="text-xl font-bold text-gray-900">TeamPayer</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-sky-600 ${
                  pathname === item.href ? 'text-sky-600' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              App starten
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü öffnen"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-sky-600 ${
                    pathname === item.href ? 'text-sky-600' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors text-center"
              >
                App starten
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💸</span>
              <span className="text-xl font-bold">TeamPayer</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Faire Kostenverteilung für Teams. Demokratisch, transparent, stressfrei.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/site/about" className="hover:text-white transition-colors">Über uns</Link></li>
              <li><Link href="/site/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/site/contact" className="hover:text-white transition-colors">Kontakt</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Rechtliches</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/site/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link href="/site/impressum#datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} TeamPayer. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
