'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Archive, Mail, User, Building2 } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/companies', label: 'Teams', icon: Building2 },
  { href: '/archive', label: 'Archiv', icon: Archive },
  { href: '/invitations', label: 'Einladungen', icon: Mail },
  { href: '/account', label: 'Account', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-20 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-sky-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
