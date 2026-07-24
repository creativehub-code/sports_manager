'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Grid,
  ArrowLeft,
  LogOut,
  Building2,
  UserCheck,
  X,
  ChevronDown,
  School as SchoolIcon,
  Shield,
  Info,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/AuthProvider'

interface MobileAppShellProps {
  children: React.ReactNode
  userEmail?: string | null
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Athletes',
    href: '/students',
    icon: Users,
  },
  {
    label: 'Events',
    href: '/events',
    icon: Trophy,
  },
  {
    label: 'Ranks',
    href: '/leaderboard/group',
    icon: BarChart3,
  },
  {
    label: 'Groups',
    href: '/groups',
    icon: Layers,
  },
]

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/admin?tab=dashboard',
    icon: LayoutDashboard,
    tab: 'dashboard',
  },
  {
    label: 'Schools',
    href: '/admin?tab=schools',
    icon: SchoolIcon,
    tab: 'schools',
  },
  {
    label: 'Info',
    href: '/admin?tab=info',
    icon: Info,
    tab: 'info',
  },
  {
    label: 'Settings',
    href: '/admin?tab=settings',
    icon: Settings,
    tab: 'settings',
  },
]

export function MobileAppShell({ children, userEmail: _userEmail }: MobileAppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user, isSuperAdmin, schools, schoolId, schoolName, setSchoolId } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeAdminTab = searchParams.get('tab') || 'dashboard'

  // Determine page title and header icons based on path
  let pageTitle = 'Athlead'
  let showBackBtn = false
  let showMenuBtn = true

  if (pathname === '/') {
    pageTitle = 'Athlead'
  } else if (pathname.startsWith('/students/')) {
    pageTitle = 'Athlete Detail'
    showBackBtn = true
    showMenuBtn = false
  } else if (pathname === '/students') {
    pageTitle = 'Add Athlete'
    showBackBtn = false
  } else if (pathname.startsWith('/events/')) {
    pageTitle = 'Event Detail'
    showBackBtn = true
    showMenuBtn = false
  } else if (pathname === '/events') {
    pageTitle = 'Events'
  } else if (pathname.startsWith('/leaderboard')) {
    pageTitle = 'Ranks'
  } else if (pathname === '/groups') {
    pageTitle = 'Groups'
  } else if (pathname === '/admin') {
    pageTitle = 'Admin Dashboard'
    showBackBtn = true
    showMenuBtn = false
  } else if (pathname === '/admin/schools') {
    pageTitle = 'Schools'
    showBackBtn = true
    showMenuBtn = false
  } else if (pathname === '/admin/users') {
    pageTitle = 'Admin Users'
    showBackBtn = true
    showMenuBtn = false
  }

  const getActiveTab = () => {
    if (pathname === '/') return '/'
    if (pathname.startsWith('/students')) return '/students'
    if (pathname.startsWith('/events')) return '/events'
    if (pathname.startsWith('/leaderboard')) return '/leaderboard/group'
    if (pathname === '/groups') return '/groups'
    return '/'
  }

  const activeTab = getActiveTab()

  async function handleSignOut() {
    setMenuOpen(false)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Sign out failed: ' + error.message)
    } else {
      toast.success('Signed out successfully')
      router.push('/login')
      router.refresh()
    }
  }

  const isAdminPage = pathname.startsWith('/admin')
  const hasBottomDock = !isAdminPage || pathname === '/admin'

  return (
    <div className="min-h-screen bg-[#010f1f] text-foreground flex items-center justify-center font-sans antialiased p-0 sm:p-4">
      {/* Device Wrapper Container */}
      <div className="w-full max-w-[480px] md:max-w-[1366px] h-screen sm:h-[880px] md:h-[95vh] lg:h-screen bg-[#051424] shadow-2xl relative border-0 sm:border md:border-0 border-[#1c2b3c] sm:rounded-[36px] md:rounded-none flex flex-col overflow-hidden">
        
        {/* Dynamic Top Bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-[#051424]/90 backdrop-blur-md z-30 select-none">
          <div className="flex items-center gap-3">
            {showBackBtn ? (
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-[#d4e4fa]" />
              </button>
            ) : showMenuBtn ? (
              <button 
                onClick={() => setMenuOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Grid className="w-5 h-5 text-[#d4e4fa]" />
              </button>
            ) : null}
          </div>

          <span className="text-lg font-semibold text-[#d4e4fa] tracking-tight">
            {pageTitle}
          </span>

          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#d4e4fa] hover:bg-white/10 active:scale-95 transition-all"
              >
                <div className="w-4 h-4 rounded-full bg-[#ffb95f]/10 border border-[#ffb95f]/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#ffb95f]">
                    {(user.email || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#909097]" />
              </button>
            )}
          </div>
        </header>

        {/* Ambient Blur Gradients inside viewport */}
        <div className="absolute top-[80px] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#7bd0ff]/5 blur-[80px] pointer-events-none z-0" />
        <div className="absolute bottom-[100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-[#ffb95f]/3 blur-[80px] pointer-events-none z-0" />

        {/* Scrollable Main Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto px-6 py-6 z-10 relative scrollbar-none",
          hasBottomDock ? "pb-6 md:pb-6 md:pl-[120px]" : "pb-6"
        )}>
          {children}
        </main>

        {/* Persistent Bottom Dock (mobile) / Left Sidebar (md+) */}
        {hasBottomDock && (
          <>
            {/* Mobile: fixed-height bar at the bottom of the flex column — never scrolls */}
            <div className="flex-shrink-0 md:hidden h-[72px] px-4 pb-3 pt-1 z-50 flex justify-center">
              <nav className="glass-dock w-full max-w-[480px] h-full rounded-[24px] px-6 flex flex-row items-center justify-between">
                {pathname === '/admin' ? (
                  adminNavItems.map((item) => {
                    const isActive = activeAdminTab === item.tab
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-90"
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-200",
                          isActive
                            ? "text-[#ffb95f] scale-110 drop-shadow-[0_0_8px_rgba(255,185,95,0.4)]"
                            : "text-[#909097] hover:text-[#d4e4fa]"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium mt-1 transition-all duration-200 select-none",
                          isActive ? "text-[#ffb95f]" : "text-[#909097] hover:text-[#d4e4fa]"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#ffb95f] shadow-[0_0_8px_#ffb95f]" />
                        )}
                      </Link>
                    )
                  })
                ) : (
                  navItems.map((item) => {
                    const isActive = activeTab === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-90"
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-200",
                          isActive
                            ? "text-[#ffb95f] scale-110 drop-shadow-[0_0_8px_rgba(255,185,95,0.4)]"
                            : "text-[#909097] hover:text-[#d4e4fa]"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium mt-1 transition-all duration-200 select-none",
                          isActive ? "text-[#ffb95f]" : "text-[#909097] hover:text-[#d4e4fa]"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#ffb95f] shadow-[0_0_8px_#ffb95f]" />
                        )}
                      </Link>
                    )
                  })
                )}
              </nav>
            </div>

            {/* md+: Absolutely positioned left sidebar within the device container */}
            <div className="hidden md:flex absolute bottom-6 left-6 top-24 w-[88px] flex-col z-50 pointer-events-none">
              <nav className="glass-dock w-full h-auto rounded-[24px] py-8 flex flex-col items-center justify-start gap-8 pointer-events-auto">
                {pathname === '/admin' ? (
                  adminNavItems.map((item) => {
                    const isActive = activeAdminTab === item.tab
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-90"
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-200",
                          isActive
                            ? "text-[#ffb95f] scale-110 drop-shadow-[0_0_8px_rgba(255,185,95,0.4)]"
                            : "text-[#909097] hover:text-[#d4e4fa]"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium mt-1 transition-all duration-200 select-none",
                          isActive ? "text-[#ffb95f]" : "text-[#909097] hover:text-[#d4e4fa]"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#ffb95f] shadow-[0_0_8px_#ffb95f]" />
                        )}
                      </Link>
                    )
                  })
                ) : (
                  navItems.map((item) => {
                    const isActive = activeTab === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-90"
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-200",
                          isActive
                            ? "text-[#ffb95f] scale-110 drop-shadow-[0_0_8px_rgba(255,185,95,0.4)]"
                            : "text-[#909097] hover:text-[#d4e4fa]"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium mt-1 transition-all duration-200 select-none",
                          isActive ? "text-[#ffb95f]" : "text-[#909097] hover:text-[#d4e4fa]"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#ffb95f] shadow-[0_0_8px_#ffb95f]" />
                        )}
                      </Link>
                    )
                  })
                )}
              </nav>
            </div>
          </>
        )}

        {/* Dynamic bottom drawer menu */}
        {menuOpen && (
          <>
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-[#0c1a2c] border-t border-white/10 rounded-t-[32px] p-6 z-50 flex flex-col space-y-5 animate-slide-up shadow-2xl">
              {/* Drag bar indicator */}
              <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#d4e4fa]">Account & Controls</h3>
                  <p className="text-[10px] text-[#909097] mt-0.5">{user?.email}</p>
                </div>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#909097] hover:text-[#d4e4fa] active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* School Switcher Section for Super Admins */}
              {isSuperAdmin && schools.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#ffb95f] flex items-center gap-1 select-none">
                    <Building2 className="w-3.5 h-3.5" />
                    Active School Context
                  </label>
                  <select
                    value={schoolId || ''}
                    onChange={(e) => {
                      setSchoolId(e.target.value)
                      toast.success(`Switched active school context`)
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#071424] border border-white/10 text-xs text-[#d4e4fa] focus:outline-none"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0c1a2c]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* General Info / School for regular admins */}
              {!isSuperAdmin && schoolName && (
                <div className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/5 flex items-center gap-2.5 text-xs text-[#d4e4fa]">
                  <SchoolIcon className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-semibold">{schoolName}</p>
                    <p className="text-[10px] text-[#909097] mt-0.5">School Admin Account</p>
                  </div>
                </div>
              )}

              {/* Super Admin Links */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#909097] px-1 select-none">
                    System Administration
                  </h4>
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ffb95f]/5 border border-[#ffb95f]/15 hover:bg-[#ffb95f]/10 text-xs font-semibold text-[#d4e4fa] transition-all active:scale-95"
                  >
                    <Shield className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <span className="font-bold text-[#ffb95f] block">Admin Dashboard</span>
                      <span className="text-[9px] text-[#8ca3c0] font-normal mt-0.5 block">Manage schools, stats & settings</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Account
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
