'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ParticipantManager } from '@/components/events/ParticipantManager'
import { ResultsEntry } from '@/components/events/ResultsEntry'
import { EventForm } from '@/components/events/EventForm'
import { cn } from '@/lib/utils'
import { ArrowLeft, Lock, Unlock, Pencil, Loader2, Sparkles, Trophy } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Event, Participant, Result, Student, Group } from '@/lib/types'

interface EventDetailClientProps {
  event: Event
  initialParticipants: Participant[]
  initialResults: Result[]
  allStudents: Student[]
  allGroups: Group[]
}

export function EventDetailClient({
  event: initialEvent,
  initialParticipants,
  initialResults,
  allStudents,
  allGroups,
}: EventDetailClientProps) {
  const supabase = createClient()

  const [event, setEvent] = useState<Event>(initialEvent)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [results, setResults] = useState<Result[]>(initialResults)
  const [editOpen, setEditOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function refetchParticipants() {
    const { data } = await supabase
      .from('participants')
      .select(`
        *,
        students(id, name, class, category),
        groups(id, name, color)
      `)
      .eq('event_id', event.id)
      .order('id')
    setParticipants(data || [])
  }

  async function refetchResults() {
    const { data } = await supabase
      .from('results')
      .select(`
        *,
        students(id, name, class),
        groups(id, name, color)
      `)
      .eq('event_id', event.id)
      .order('rank')
    setResults(data || [])
  }

  async function refetchEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', event.id)
      .single()
    if (data) setEvent(data)
  }

  async function toggleLock() {
    setToggling(true)
    const newStatus = event.status === 'open' ? 'locked' : 'open'
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', event.id)
    if (error) {
      toast.error('Failed: ' + error.message)
    } else {
      toast.success(newStatus === 'locked' ? 'Event locked — results are final' : 'Event unlocked')
      refetchEvent()
      refetchResults() // Recalculate
    }
    setToggling(false)
  }

  const isLocked = event.status === 'locked'

  return (
    <div className="space-y-6 pb-20">
      {/* Back button link */}
      <Link
        href="/events"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-xs font-semibold text-[#d4e4fa]"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#ffb95f]" />
        Back to Events
      </Link>

      {/* Event Header Stats Card */}
      <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-[#7bd0ff]/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-[#d4e4fa]">{event.name}</h1>
            <div className="flex items-center gap-2 select-none pt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#909097] bg-white/5 px-1.5 py-0.5 rounded">
                {event.type} event
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#7bd0ff] bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 px-1.5 py-0.5 rounded">
                {event.category || 'Senior'}
              </span>
              {event.point_multiplier !== 1 && (
                <span className="text-[9px] font-bold text-[#7bd0ff] bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Sparkles className="w-2 h-2" />
                  ×{event.point_multiplier} Points
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border select-none',
              event.status === 'open'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            )}
          >
            {event.status === 'open' ? '● Open' : '🔒 Locked'}
          </span>
        </div>

        {/* Base Points & Control Buttons Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
          <div className="text-xs text-[#909097] select-none">
            Points config: 🥇 {event.points_1st} · 🥈 {event.points_2nd} · 🥉 {event.points_3rd} pts
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditOpen(true)}
              disabled={isLocked}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#d4e4fa] disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <Pencil className="w-3.5 h-3.5 text-[#ffb95f]" />
              Edit
            </button>
            <button
              onClick={toggleLock}
              disabled={toggling}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all select-none',
                isLocked
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
              )}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isLocked ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {isLocked ? 'Unlock' : 'Lock Results'}
            </button>
          </div>
        </div>
      </div>

      {/* Two column layouts for participant manager & results entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Participants */}
        <div className="glass-card rounded-[24px] p-5">
          <ParticipantManager
            event={event}
            participants={participants}
            students={allStudents}
            groups={allGroups}
            onParticipantsChanged={refetchParticipants}
          />
        </div>

        {/* Right: Results podium */}
        <div className="glass-card rounded-[24px] p-5">
          <ResultsEntry
            event={event}
            participants={participants}
            results={results}
            onResultsChanged={refetchResults}
          />
        </div>
      </div>

      {/* Edit Event Modal Dialog */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#909097] mb-4">Edit Event</h2>
            <EventForm
              event={event}
              onSuccess={() => {
                setEditOpen(false)
                refetchEvent()
              }}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
