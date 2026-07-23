'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trophy, Loader2, Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event, Participant, Result, Rank } from '@/lib/types'

const RANKS: { rank: Rank; label: string; medal: string; class: string; borderGlow: string }[] = [
  { rank: 1, label: '1st Gold Medalist', medal: '🥇', class: 'medal-gold', borderGlow: 'hover:border-[#ffb95f]/30' },
  { rank: 2, label: '2nd Silver Medalist', medal: '🥈', class: 'medal-silver', borderGlow: 'hover:border-[#bec6e0]/30' },
  { rank: 3, label: '3rd Bronze Medalist', medal: '🥉', class: 'medal-bronze', borderGlow: 'hover:border-[#e7a066]/30' },
]

interface ResultsEntryProps {
  event: Event
  participants: Participant[]
  results: Result[]
  onResultsChanged: () => void
}

export function ResultsEntry({
  event,
  participants,
  results,
  onResultsChanged,
}: ResultsEntryProps) {
  const supabase = createClient()
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Rank | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const isLocked = event.status === 'locked'
  const isIndividual = event.type === 'individual'

  // Existing result for rank
  function getExistingResult(rank: Rank) {
    return results.find((r) => r.rank === rank) || null
  }

  // Used participant IDs in other ranks
  function getUsedIds(excludeRank?: Rank) {
    return new Set(
      results
        .filter((r) => r.rank !== excludeRank)
        .map((r) => (isIndividual ? r.student_id : r.group_id))
        .filter(Boolean) as string[]
    )
  }

  async function saveResult(rank: Rank) {
    const selectedId = selections[rank]
    if (!selectedId) {
      toast.error('Please select a winner')
      return
    }

    const used = getUsedIds(rank)
    if (used.has(selectedId)) {
      toast.error('This participant already has a different rank')
      return
    }

    setSaving(rank)

    const basePoints =
      rank === 1 ? event.points_1st : rank === 2 ? event.points_2nd : event.points_3rd
    const pointsEarned = basePoints * event.point_multiplier

    const payload = {
      event_id: event.id,
      rank,
      student_id: isIndividual ? selectedId : null,
      group_id: !isIndividual ? selectedId : null,
      points_earned: pointsEarned,
    }

    const existing = getExistingResult(rank)
    if (existing) {
      await supabase.from('results').delete().eq('id', existing.id)
    }

    const { error } = await supabase.from('results').insert(payload as any)
    if (error) {
      if (error.message.includes('locked') || error.code === '42501') {
        toast.error('Cannot add results — event is locked')
      } else {
        toast.error('Failed to save result: ' + error.message)
      }
    } else {
      toast.success(`${RANKS.find((r) => r.rank === rank)?.label} saved`)
      setSelections((prev) => { const n = { ...prev }; delete n[rank]; return n })
      onResultsChanged()
    }
    setSaving(null)
  }

  async function deleteResult(resultId: string) {
    setDeleting(resultId)
    const { error } = await supabase.from('results').delete().eq('id', resultId)
    if (error) {
      toast.error('Could not delete result: ' + error.message)
    } else {
      toast.success('Result removed')
      onResultsChanged()
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#909097] flex items-center gap-2 select-none">
          <Trophy className="w-4 h-4 text-[#ffb95f]" />
          Podium Results
        </h3>
        {isLocked && (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full select-none">
            🔒 Locked
          </span>
        )}
      </div>

      {participants.length < 1 ? (
        <div className="py-8 text-center text-xs text-[#909097] border border-dashed border-white/10 rounded-2xl select-none">
          Register participants first to record podium winners.
        </div>
      ) : (
        <div className="space-y-4">
          {RANKS.map(({ rank, label, medal, class: medalClass, borderGlow }) => {
            const existing = getExistingResult(rank)
            const usedIds = getUsedIds(rank)

            // Build options list
            const options = participants.filter((p) => {
              const id = isIndividual ? p.student_id : p.group_id
              return id && !usedIds.has(id)
            })

            const existingName = existing
              ? isIndividual
                ? existing.students?.name
                : existing.groups?.name
              : null

            const ptsEarned = ((rank === 1 ? event.points_1st : rank === 2 ? event.points_2nd : event.points_3rd) * event.point_multiplier).toFixed(1)

            return (
              <div
                key={rank}
                className={cn(
                  'p-4 rounded-[24px] bg-white/[0.015] border border-white/5 space-y-3 transition-all',
                  borderGlow
                )}
              >
                {/* Header Rank Label */}
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{medal}</span>
                    <span className="text-xs font-semibold text-[#d4e4fa]">{label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#909097] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    +{ptsEarned} pts
                  </span>
                </div>

                {/* Main Action Field */}
                {existing ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-[#d4e4fa]">{existingName}</span>
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => deleteResult(existing.id)}
                        disabled={deleting === existing.id}
                        className="p-1.5 rounded-full hover:bg-red-500/10 text-[#909097] hover:text-red-400 transition-all"
                        title="Remove result"
                      >
                        {deleting === existing.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                ) : isLocked ? (
                  <p className="text-xs text-[#909097] italic select-none pl-1">No winner recorded</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selections[rank] || ''}
                      onChange={(e) =>
                        setSelections((prev) => ({ ...prev, [rank]: e.target.value }))
                      }
                      className="flex-1 px-4 py-3 rounded-2xl input-glass text-xs text-[#d4e4fa] focus:outline-none"
                    >
                      <option value="" className="bg-[#0c1a2c]">— Select Winner —</option>
                      {options.map((p) => {
                        const id = isIndividual ? p.student_id : p.group_id
                        const name = isIndividual ? p.students?.name : p.groups?.name
                        return (
                          <option key={id} value={id!} className="bg-[#0c1a2c]">
                            {name}
                            {isIndividual && p.students?.class ? ` (${p.students.class})` : ''}
                          </option>
                        )
                      })}
                    </select>
                    <button
                      onClick={() => saveResult(rank)}
                      disabled={saving === rank || !selections[rank]}
                      className="px-4 py-3 rounded-full bg-[#bec6e0]/10 hover:bg-[#bec6e0]/20 border border-[#bec6e0]/20 text-xs font-bold text-[#d4e4fa] disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
                    >
                      {saving === rank ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Add Point'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
