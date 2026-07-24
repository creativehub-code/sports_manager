'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'
import type { Event, EventType } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'

interface EventFormProps {
  event?: Event
  onSuccess: () => void
  onCancel: () => void
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const isEdit = !!event
  const supabase = createClient()
  const { schoolId } = useAuth()

  const [name, setName] = useState(event?.name || '')
  const [type, setType] = useState<EventType>(event?.type || 'individual')
  const [points1st, setPoints1st] = useState(event?.points_1st ?? 5)
  const [points2nd, setPoints2nd] = useState(event?.points_2nd ?? 3)
  const [points3rd, setPoints3rd] = useState(event?.points_3rd ?? 1)
  const [multiplier, setMultiplier] = useState(event?.point_multiplier ?? 1.0)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const payload = {
      name: name.trim(),
      type,
      points_1st: points1st,
      points_2nd: points2nd,
      points_3rd: points3rd,
      point_multiplier: multiplier,
    }

    try {
      if (isEdit) {
        if (!schoolId) throw new Error('No school context selected')
        const { error } = await supabase.from('events').update(payload).eq('id', event.id)
        if (error) throw error
        toast.success('Event updated successfully')
      } else {
        if (!schoolId) throw new Error('No school context selected')
        const { error } = await supabase.from('events').insert({ ...payload, status: 'open', school_id: schoolId })
        if (error) throw error
        toast.success('Event created successfully')
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
      {/* Event Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">Event Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 100m Sprint Finals"
          required
          className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
        />
      </div>

      {/* Event Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">Event Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['individual', 'group'] as EventType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-3 px-4 rounded-2xl text-sm font-semibold capitalize border transition-all ${
                type === t
                  ? 'bg-[#ffb95f]/10 border-[#ffb95f]/40 text-[#ffb95f]'
                  : 'bg-white/5 border-white/5 text-[#909097] hover:text-[#d4e4fa]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">Base Points</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '🥇 1st', value: points1st, set: setPoints1st },
            { label: '🥈 2nd', value: points2nd, set: setPoints2nd },
            { label: '🥉 3rd', value: points3rd, set: setPoints3rd },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-semibold text-[#909097] text-center select-none">{label}</p>
              <input
                type="number"
                min={0}
                max={100}
                value={value}
                onChange={(e) => set(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl input-glass text-center text-sm text-[#d4e4fa] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Multiplier */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">
          Point Multiplier
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
            className="w-24 px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
          />
          <span className="text-sm text-[#909097] select-none">×</span>
          {multiplier !== 1 && (
            <span className="text-[10px] font-bold text-[#ffb95f] bg-[#ffb95f]/10 border border-[#ffb95f]/20 px-2 py-1 rounded-full select-none">
              1st = {(points1st * multiplier).toFixed(1)} pts
            </span>
          )}
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
          {isEdit ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}
