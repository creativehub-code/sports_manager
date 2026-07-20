'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'
import type { Group } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#64748b',
]

interface GroupFormProps {
  group?: Group
  onSuccess: () => void
  onCancel: () => void
}

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const isEdit = !!group
  const supabase = createClient()
  const { schoolId } = useAuth()

  const [name, setName] = useState(group?.name || '')
  const [color, setColor] = useState(group?.color || '#3b82f6')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('groups')
          .update({ name: name.trim(), color })
          .eq('id', group.id)
        if (error) throw error
        toast.success('Group updated successfully')
      } else {
        if (!schoolId) throw new Error('No school context selected')
        const { error } = await supabase
          .from('groups')
          .insert({ name: name.trim(), color, school_id: schoolId })
        if (error) throw error
        toast.success('Group created successfully')
      }
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Group Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Red House"
          required
          className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
        />
      </div>

      {/* Preset Swatches */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">Theme Color</label>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-7 h-7 rounded-full transition-all duration-150 relative flex items-center justify-center border border-white/10 ${
                color === c ? 'scale-115 ring-2 ring-[#ffb95f]' : 'hover:scale-110'
              }`}
              title={c}
            >
              {color === c && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          ))}
        </div>

        {/* Custom hex selector */}
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
            className="flex-1 px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold text-[#d4e4fa] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 py-3 rounded-full action-btn-primary text-sm flex items-center justify-center gap-2 select-none"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2a1700]" />
          ) : (
            <Check className="w-4 h-4 text-[#2a1700]" />
          )}
          {isEdit ? 'Save Changes' : 'Create Group'}
        </button>
      </div>
    </form>
  )
}
