'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Search, Plus, X, Users, Loader2, UserMinus } from 'lucide-react'
import type { Event, Participant, Student, Group } from '@/lib/types'

interface ParticipantManagerProps {
  event: Event
  participants: Participant[]
  students: Student[]
  groups: Group[]
  onParticipantsChanged: () => void
}

export function ParticipantManager({
  event,
  participants,
  students,
  groups,
  onParticipantsChanged,
}: ParticipantManagerProps) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [dropdown, setDropdown] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLocked = event.status === 'locked'
  const isIndividual = event.type === 'individual'

  // IDs already added
  const addedStudentIds = new Set(participants.map((p) => p.student_id).filter(Boolean) as string[])
  const addedGroupIds = new Set(participants.map((p) => p.group_id).filter(Boolean) as string[])

  // Filter suggestions
  const suggestions = isIndividual
    ? students.filter(
        (s) =>
          !addedStudentIds.has(s.id) &&
          (s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.class.toLowerCase().includes(search.toLowerCase()))
      )
    : groups.filter(
        (g) =>
          !addedGroupIds.has(g.id) &&
          g.name.toLowerCase().includes(search.toLowerCase())
      )

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function addParticipant(id: string) {
    setAdding(true)
    setDropdown(false)
    setSearch('')

    const payload = isIndividual
      ? { event_id: event.id, student_id: id, group_id: null }
      : { event_id: event.id, student_id: null, group_id: id }

    const { error } = await supabase.from('participants').insert(payload as any)
    if (error) {
      toast.error('Could not add participant: ' + error.message)
    } else {
      onParticipantsChanged()
    }
    setAdding(false)
  }

  async function removeParticipant(participantId: string) {
    setRemoving(participantId)
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId)
    if (error) {
      toast.error('Could not remove: ' + error.message)
    } else {
      onParticipantsChanged()
    }
    setRemoving(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#909097] flex items-center gap-2 select-none">
          <Users className="w-4 h-4 text-[#7bd0ff]" />
          Registered Participants ({participants.length})
        </h3>
        {isLocked && (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full select-none">
            🔒 Locked
          </span>
        )}
      </div>

      {/* Search & Add */}
      {!isLocked && (
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl input-glass">
            <Search className="w-4 h-4 text-[#909097] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setDropdown(true)
              }}
              onFocus={() => setDropdown(true)}
              placeholder={
                isIndividual ? 'Search student name...' : 'Search house name...'
              }
              className="flex-1 bg-transparent text-[#d4e4fa] placeholder:text-[#909097]/50 focus:outline-none text-sm"
              disabled={adding}
            />
            {adding && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#909097]" />}
          </div>

          {/* Suggestions Dropdown */}
          {dropdown && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-20 top-full mt-2 left-0 right-0 bg-[#0d1c2d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
            >
              {suggestions.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addParticipant(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left text-sm border-b border-white/5 last:border-b-0"
                >
                  {isIndividual ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-[#7bd0ff] font-semibold">
                          {(item as Student).name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#d4e4fa] text-xs">{(item as Student).name}</p>
                        <p className="text-[10px] text-[#909097] mt-0.5">
                          {(item as Student).class} · {(item as Student).category}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 border border-white/10"
                        style={{ backgroundColor: (item as Group).color || '#909097' }}
                      />
                      <span className="font-semibold text-xs text-[#d4e4fa]">{(item as Group).name}</span>
                    </>
                  )}
                  <Plus className="w-4 h-4 text-[#ffb95f] ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participant List */}
      {participants.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#909097] border border-dashed border-white/10 rounded-2xl select-none">
          No participants added yet.{' '}
          {!isLocked && 'Search above to register.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {participants.map((p) => {
            const displayName = isIndividual
              ? p.students?.name
              : p.groups?.name
            const subtitle = isIndividual
              ? `${p.students?.class} · ${p.students?.category}`
              : null
            const color = !isIndividual ? p.groups?.color : null

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 ${
                    color ? '' : 'bg-white/5'
                  }`}
                    style={color ? { backgroundColor: color } : undefined}
                  >
                    {!color && (
                      <span className="text-xs text-[#7bd0ff] font-semibold">
                        {displayName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#d4e4fa]">{displayName}</p>
                    {subtitle && <p className="text-[10px] text-[#909097] mt-0.5">{subtitle}</p>}
                  </div>
                </div>

                {!isLocked && (
                  <button
                    onClick={() => removeParticipant(p.id)}
                    disabled={removing === p.id}
                    className="p-1.5 rounded-full hover:bg-red-500/10 text-[#909097] hover:text-red-400 transition-all"
                    title="Remove participant"
                  >
                    {removing === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
