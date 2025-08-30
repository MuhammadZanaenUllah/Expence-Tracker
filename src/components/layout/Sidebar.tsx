'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Settings,
  LogOut,
  CreditCard,
  User,
  Shield
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Subscription', href: '/subscription', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.role) {
            setUserRole(data.user.role)
          }
        })
        .catch(console.error)
    }
  }, [session])

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">ExpenseTracker</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
        
        {/* Admin Navigation */}
        {userRole === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </div>
            </div>
            <Link
              href="/admin"
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  pathname.startsWith('/admin') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="mt-3 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}