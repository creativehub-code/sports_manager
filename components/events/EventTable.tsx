'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Plus,
  CalendarDays,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { EventForm } from './EventForm'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'

interface EventTableProps {
  initialEvents: Event[]
}

export function EventTable({ initialEvents }: EventTableProps) {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [filter, setFilter] = useState<'all' | 'individual' | 'group'>('all')
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Event | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  async function refetch() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    setEvents(data || [])
  }

  async function toggleLock(event: Event) {
    setToggling(event.id)
    const newStatus = event.status === 'open' ? 'locked' : 'open'
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', event.id)
    if (error) {
      toast.error('Failed to update event status')
    } else {
      toast.success(
        newStatus === 'locked'
          ? `"${event.name}" locked — results are final`
          : `"${event.name}" unlocked — results can be edited`
      )
      refetch()
    }
    setToggling(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Delete failed: ' + error.message)
    } else {
      toast.success(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      refetch()
    }
    setDeleting(false)
  }

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true
    return e.type === filter
  })

  return (
    <div className="space-y-6 pb-20">
      {/* Header & New Event button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">
            Event Management
          </h2>
          <p className="text-xs text-[#909097]/80 mt-1 select-none">
            {events.length} event{events.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setDialogMode('create') }}
          className="px-4 py-2.5 rounded-full action-btn-primary text-xs flex items-center gap-1.5 select-none"
        >
          <Plus className="w-3.5 h-3.5 text-[#2a1700]" />
          New Event
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'individual', 'group'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold border capitalize transition-all whitespace-nowrap',
              filter === type
                ? 'bg-[#ffb95f]/10 border-[#ffb95f]/40 text-[#ffb95f]'
                : 'border-white/5 text-[#909097] hover:text-[#d4e4fa] hover:border-white/10'
            )}
          >
            {type} Events
          </button>
        ))}
      </div>

      {/* Events List of Glass Cards */}
      {filteredEvents.length === 0 ? (
        <div className="glass-card rounded-[24px] py-16 flex flex-col items-center justify-center text-center">
          <CalendarDays className="w-8 h-8 text-[#909097] opacity-40 mb-2" />
          <p className="text-sm font-semibold text-[#d4e4fa]">No events found</p>
          <p className="text-xs text-[#909097] mt-1">Configure your first event to start logging results</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const isOpen = event.status === 'open'
            return (
              <div
                key={event.id}
                className="glass-card rounded-[24px] p-4 flex flex-col gap-3 border-white/5 hover:border-[#ffb95f]/15"
              >
                {/* Top Section: Name & Details */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-[#7bd0ff]" />
                    </div>
                    <div>
                      <Link
                        href={`/events/${event.id}`}
                        className="text-sm font-semibold text-[#d4e4fa] hover:text-[#ffb95f] transition-colors flex items-center gap-1 group"
                      >
                        {event.name}
                        <ChevronRight className="w-4 h-4 text-[#909097] group-hover:text-[#ffb95f] transition-colors" />
                      </Link>
                      <div className="flex items-center gap-2 mt-1 select-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#909097] bg-white/5 px-1.5 py-0.5 rounded">
                          {event.type}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#7bd0ff] bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 px-1.5 py-0.5 rounded">
                          {event.category || 'Senior'}
                        </span>
                        {event.point_multiplier !== 1 && (
                          <span className="text-[9px] font-bold text-[#7bd0ff] bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2" />
                            ×{event.point_multiplier} Multiplier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <button
                    onClick={() => toggleLock(event)}
                    disabled={toggling === event.id}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all select-none',
                      isOpen
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    )}
                  >
                    {isOpen ? '● Open' : '🔒 Locked'}
                  </button>
                </div>

                {/* Bottom Section: Points Breakdown & Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-[#909097] select-none">
                  <div>
                    Points: 🥇 {event.points_1st} · 🥈 {event.points_2nd} · 🥉 {event.points_3rd}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Action buttons */}
                    <button
                      onClick={() => { setEditTarget(event); setDialogMode('edit') }}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#909097] hover:text-[#d4e4fa] active:scale-90 transition-all"
                      title="Edit Event"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="p-2 rounded-full bg-white/5 hover:bg-red-500/10 text-[#909097] hover:text-red-400 active:scale-90 transition-all"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/events/${event.id}`}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#d4e4fa] hover:bg-white/10 transition-all"
                    >
                      Enter Results
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog Modal */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#909097] mb-4">
              {dialogMode === 'create' ? 'Create Event' : 'Edit Event'}
            </h2>
            <EventForm
              event={editTarget || undefined}
              onSuccess={() => { setDialogMode(null); refetch() }}
              onCancel={() => setDialogMode(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-red-400 mb-2">Delete Event</h2>
            <p className="text-xs text-[#909097] leading-relaxed mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#d4e4fa]">"{deleteTarget.name}"</span>?
              All associated participant data and results records will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#d4e4fa] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
