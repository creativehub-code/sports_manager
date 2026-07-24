'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  CalendarDays,
  BarChart3,
  Medal,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    label: 'Groups',
    href: '/groups',
    icon: Shield,
  },
  {
    label: 'Events',
    href: '/events',
    icon: CalendarDays,
  },
  {
    label: 'Individual Leaderboard',
    href: '/leaderboard/individual',
    icon: BarChart3,
  },
  {
    label: 'Group Leaderboard',
    href: '/leaderboard/group',
    icon: Medal,
  },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
          <Image src="/logo.png" alt="Athlead Logo" width={36} height={36} className="object-contain" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Athlead</p>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
