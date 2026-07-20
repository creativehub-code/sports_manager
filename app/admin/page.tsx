'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SchoolManagement } from '@/components/admin/SchoolManagement'
import { 
  LayoutDashboard, 
  School, 
  Info, 
  Settings, 
  Users, 
  MapPin, 
  Mail, 
  Loader2, 
  LogOut,
  Shield,
  ArrowUpRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SchoolInfo {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  adminEmail: string | null
  athleteCount: number
  created_at: string
}

interface DashboardData {
  totalSchools: number
  totalAthletes: number
  schoolsInfo: SchoolInfo[]
}

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Tab State
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>('dashboard')

  // Data Fetching State
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  // Sync tab with URL query parameter
  useEffect(() => {
    const validTabs = ['dashboard', 'schools', 'info', 'settings']
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch logged in admin details
  useEffect(() => {
    async function getAdminUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminEmail(user.email || 'Super Admin')
      }
    }
    getAdminUser()
  }, [supabase])

  // Fetch stats and directory info
  async function fetchDashboardData(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Forbidden: Super Admin role required.')
          router.replace('/')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error(err.message || 'Error loading dashboard statistics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`/admin?tab=${tab}`, { scroll: false })
  }

  const handleMutation = () => {
    // Re-fetch data silently to update counts and tables instantly
    fetchDashboardData(true)
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign out.')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#051424]">
      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-[#8ca3c0]">Loading administration panel...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* Intro welcome card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-white/5">
                  <div className="flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Super Admin Console</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">Welcome, System Administrator</h3>
                  <p className="text-xs text-[#8ca3c0] mt-1 max-w-md leading-relaxed">
                    View global sports network statistics, register new client schools, view active school administrators, and manage settings.
                  </p>
                </div>

                {/* Grid of Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Schools Card */}
                  <div className="relative overflow-hidden p-5 rounded-3xl bg-[#0f1d30]/40 border border-white/5 shadow-xl transition-all duration-300 hover:border-white/10 group">
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-[#ffb95f]/5 border border-[#ffb95f]/15 flex items-center justify-center text-[#ffb95f]">
                      <School className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#8ca3c0]">Registered Schools</span>
                    <h4 className="text-3xl font-extrabold text-white mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                      {data?.totalSchools || 0}
                    </h4>
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-primary hover:underline cursor-pointer" onClick={() => handleTabChange('schools')}>
                      <span>Manage schools</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Total Athletes Card */}
                  <div className="relative overflow-hidden p-5 rounded-3xl bg-[#0f1d30]/40 border border-white/5 shadow-xl transition-all duration-300 hover:border-white/10 group">
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-cyan-400/5 border border-cyan-400/15 flex items-center justify-center text-cyan-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#8ca3c0]">Total Athletes</span>
                    <h4 className="text-3xl font-extrabold text-white mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                      {data?.totalAthletes || 0}
                    </h4>
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-cyan-400 hover:underline cursor-pointer" onClick={() => handleTabChange('info')}>
                      <span>View details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MANAGE SCHOOLS TAB */}
            {activeTab === 'schools' && (
              <div className="animate-fade-in">
                <SchoolManagement onMutation={handleMutation} />
              </div>
            )}

            {/* 3. INFORMATION TAB (SCHOOLS DIRECTORY) */}
            {activeTab === 'info' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-white">Schools Directory</h2>
                  <p className="text-xs text-[#8ca3c0] mt-0.5">Contact details and athlete enrollments per school</p>
                </div>

                <div className="space-y-4">
                  {!data || data.schoolsInfo.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#091526]/40 border border-white/5 rounded-2xl">
                      <School className="w-8 h-8 text-[#526a8a] mb-2" />
                      <p className="text-sm font-semibold text-white">No schools registered</p>
                    </div>
                  ) : (
                    data.schoolsInfo.map((school) => (
                      <div 
                        key={school.id} 
                        className="bg-[#0b1b2f] border border-white/5 rounded-2xl p-5 space-y-4 shadow-md transition-colors"
                      >
                        {/* Name Header */}
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {school.logo_url ? (
                              <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                            ) : (
                              <School className="w-5 h-5 text-[#d4e4fa]" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-snug">{school.name}</h4>
                            <span className="text-[10px] text-[#526a8a] font-mono break-all leading-none">{school.id}</span>
                          </div>
                        </div>

                        {/* Details Details Grid */}
                        <div className="grid grid-cols-1 gap-2.5 text-xs text-[#8ca3c0]">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-white block">Location / Address</span>
                              <span className="text-[11px] leading-relaxed text-[#8ca3c0]">
                                {school.address || 'No address registered'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-white block">School Administrator</span>
                              {school.adminEmail ? (
                                <span className="text-[11px] text-white break-all">{school.adminEmail}</span>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] text-amber-500 italic">No admin assigned</span>
                                  <Link 
                                    href="/admin/users" 
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center"
                                  >
                                    [Invite Admin]
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-white block">Athletes Enrolled</span>
                              <span className="text-[11px] font-bold text-white">{school.athleteCount} students</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. SETTINGS & CONTROLS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-white">Settings</h2>
                  <p className="text-xs text-[#8ca3c0] mt-0.5">System administration controls and details</p>
                </div>

                {/* Account Details Card */}
                <div className="bg-[#0b1b2f] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                    Super Admin Account
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-[#526a8a] uppercase tracking-wider block">Logged In As</span>
                      <span className="text-sm font-bold text-[#d4e4fa] break-all">{adminEmail || 'Loading...'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#526a8a] uppercase tracking-wider block">Privilege Tier</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-primary/10 border-primary/20 text-primary mt-1">
                        <Shield className="w-3 h-3" />
                        System Administrator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Actions Card */}
                <div className="bg-[#0b1b2f] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                    Administrative Controls
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      href="/admin/users"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-white hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <span className="text-xs font-bold block">Admin Account Invites</span>
                          <span className="text-[10px] text-[#8ca3c0]">Manage credentials and invite users</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#8ca3c0]" />
                    </Link>
                  </div>
                </div>

                {/* Log Out button */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all font-semibold text-xs rounded-2xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Account
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
