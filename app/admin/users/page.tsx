'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'
import type { School } from '@/lib/types'
import { 
  Mail, 
  Plus, 
  User, 
  School as SchoolIcon, 
  ShieldAlert, 
  Check, 
  Clock, 
  Loader2,
  ChevronDown 
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string | undefined
  role: string
  schoolId: string | null
  lastSignIn: string | null
  created_at: string
  invited_at: string | undefined
  confirmed_at: string | undefined
}

export default function AdminUsersPage() {
  const { schools: authSchools } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [apiSchools, setApiSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Use authSchools if available, otherwise fallback to apiSchools fetched from server
  const availableSchools = authSchools.length > 0 ? authSchools : apiSchools

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok && data.users) {
        setUsers(data.users)
        if (data.schools && Array.isArray(data.schools)) {
          setApiSchools(data.schools)
        }
      } else {
        toast.error(data.error || 'Failed to fetch admin users.')
      }
    } catch (err) {
      toast.error('An error occurred while fetching users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Auto-select first school when schools load
  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].id)
    }
  }, [availableSchools, selectedSchoolId])

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail || !selectedSchoolId) {
      toast.error('Please enter an email and select a school.')
      return
    }

    setInviting(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, schoolId: selectedSchoolId }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(`Invitation successfully sent to ${inviteEmail}`)
        setInviteEmail('')
        setShowInviteForm(false)
        fetchUsers() // Refresh user list
      } else {
        toast.error(data.error || 'Failed to send invitation.')
      }
    } catch (err) {
      toast.error('An error occurred while sending invitation.')
    } finally {
      setInviting(false)
    }
  }

  function getSchoolName(schoolId: string | null) {
    if (!schoolId) return 'N/A (All Schools)'
    const school = availableSchools.find((s) => s.id === schoolId)
    return school ? school.name : 'Unknown School'
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#051424] overflow-y-auto pb-10">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Admin Accounts</h2>
            <p className="text-xs text-[#8ca3c0] mt-0.5">Manage and invite school administrators</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            Invite Admin
          </button>
        </div>

        {/* Invite Form Card */}
        {showInviteForm && (
          <div className="bg-[#0f1d30]/65 border border-white/5 rounded-2xl p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Send Invitation Link</h3>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8ca3c0]">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="admin@school.edu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#081526] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#526a8a] focus:outline-none focus:border-primary transition-colors"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526a8a]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8ca3c0]">Assigned School</label>
                <div className="relative">
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    required
                    disabled={availableSchools.length === 0}
                    className="w-full pl-4 pr-10 py-2.5 bg-[#081526] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {availableSchools.length === 0 ? (
                      <option value="" disabled className="bg-[#081526] text-[#8ca3c0]">
                        No schools available
                      </option>
                    ) : (
                      <>
                        <option value="" disabled className="bg-[#081526] text-[#8ca3c0]">
                          -- Select a school --
                        </option>
                        {availableSchools.map((school) => (
                          <option key={school.id} value={school.id} className="bg-[#081526] text-white py-1">
                            {school.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526a8a] pointer-events-none" />
                </div>
                {availableSchools.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No schools registered yet. Please create a school first under Schools management.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || availableSchools.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/95 disabled:opacity-50 transition-all duration-200"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User Accounts List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-[#8ca3c0]">Loading administrators...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-[#091526]/40 border border-white/5 rounded-2xl">
              <User className="w-8 h-8 text-[#526a8a] mb-2" />
              <p className="text-sm font-semibold text-white">No administrators found</p>
              <p className="text-xs text-[#8ca3c0] mt-1 max-w-[240px]">Invite your first school administrator to get started.</p>
            </div>
          ) : (
            users.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#0b1b2f] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-colors"
              >
                {/* Header Information */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#d4e4fa]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white break-all">{item.email}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <SchoolIcon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {getSchoolName(item.schoolId)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    item.confirmed_at 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {item.confirmed_at ? (
                      <>
                        <Check className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Invited
                      </>
                    )}
                  </span>
                </div>

                {/* Details Footer */}
                <div className="border-t border-white/5 pt-3 flex justify-between text-[11px] text-[#8ca3c0]">
                  <div>
                    <span className="font-medium text-[#526a8a]">Role: </span>
                    <span className="font-bold text-white uppercase tracking-wide">{item.role}</span>
                  </div>
                  <div>
                    {item.lastSignIn ? (
                      <>
                        <span className="font-medium text-[#526a8a]">Active: </span>
                        <span>{new Date(item.lastSignIn).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-[#526a8a]">Invited: </span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

