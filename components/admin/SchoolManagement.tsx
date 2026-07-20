'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, School, Trash2, Loader2, MapPin } from 'lucide-react'

interface SchoolManagementProps {
  onMutation?: () => void
}

export function SchoolManagement({ onMutation }: SchoolManagementProps) {
  const { schools, refetchSchools } = useAuth()
  const supabase = createClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [address, setAddress] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAddSchool(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return

    setAdding(true)
    try {
      const insertPayload: any = { name, logo_url: logoUrl || null }
      if (address.trim()) {
        insertPayload.address = address.trim()
      }

      let { error } = await supabase
        .from('schools')
        .insert(insertPayload as any)

      // Gracefully handle case where "address" column does not exist in the database or schema cache is stale
      const errMsg = error ? error.message.toLowerCase() : ''
      if (error && (
        errMsg.includes('address') || 
        errMsg.includes('schema cache') || 
        error.code === 'P0002' || 
        errMsg.includes('does not exist')
      )) {
        console.warn('Address column does not exist or schema cache is stale. Retrying insertion without address field...')
        const retryPayload = { name, logo_url: logoUrl || null }
        const { error: retryErr } = await supabase
          .from('schools')
          .insert(retryPayload as any)
        
        if (retryErr) {
          error = retryErr
        } else {
          error = null
          toast.warning(`School registered, but address could not be saved (database migration pending or schema cache stale).`)
        }
      }

      if (error) {
        toast.error(error.message || 'Failed to add school.')
      } else {
        if (!address.trim() || !error) {
          toast.success(`School "${name}" created successfully.`)
        }
        setName('')
        setLogoUrl('')
        setAddress('')
        setShowAddForm(false)
        await refetchSchools()
        onMutation?.()
      }
    } catch (err) {
      toast.error('An error occurred while creating school.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteSchool(id: string, schoolName: string) {
    if (!window.confirm(`Are you sure you want to delete "${schoolName}"? This will delete all associated groups, students, events, and administrator accounts.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/schools/${id}`, {
        method: 'DELETE'
      })
      
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to delete school.')
      } else {
        toast.success(`School "${schoolName}" deleted.`)
        await refetchSchools()
        onMutation?.()
      }
    } catch (err) {
      toast.error('An error occurred while deleting school.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Schools / Tenants</h2>
          <p className="text-xs text-[#8ca3c0] mt-0.5">Manage sports tenant accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Add School
        </button>
      </div>

      {/* Add School Form */}
      {showAddForm && (
        <div className="bg-[#0f1d30]/65 border border-white/5 rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">New School Registration</h3>
          <form onSubmit={handleAddSchool} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8ca3c0]">School Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Greenwood High School"
                  required
                  className="w-full px-4 py-2.5 bg-[#081526] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#526a8a] focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8ca3c0]">Logo URL (Optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 bg-[#081526] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#526a8a] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8ca3c0]">School Address (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Education Way, Sector 4, Bangalore"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#081526] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#526a8a] focus:outline-none focus:border-primary transition-colors"
                />
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526a8a]" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/95 disabled:opacity-50 transition-all duration-200"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Register School'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools List */}
      <div className="space-y-3">
        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#091526]/40 border border-white/5 rounded-2xl">
            <School className="w-8 h-8 text-[#526a8a] mb-2" />
            <p className="text-sm font-semibold text-white">No schools registered</p>
          </div>
        ) : (
          schools.map((item) => (
            <div 
              key={item.id} 
              className="bg-[#0b1b2f] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <School className="w-5 h-5 text-[#d4e4fa]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <span className="text-[10px] text-[#526a8a] font-mono break-all">{item.id}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteSchool(item.id, item.name)}
                disabled={deletingId !== null}
                className="p-2 text-[#ea580c] hover:bg-white/5 active:scale-95 rounded-lg transition-all"
              >
                {deletingId === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
