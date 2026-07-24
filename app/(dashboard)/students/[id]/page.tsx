import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Camera, CalendarDays, Trophy } from 'lucide-react'
import { cn, getCategoryColor, getRankLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Student Detail' }

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: student, error } = await (supabase
    .from('students')
    .select(`
      *,
      groups(id, name, color)
    `)
    .eq('id', params.id)
    .single() as any)

  if (error || !student) notFound()

  // Participation history
  const { data: participations } = await supabase
    .from('participants')
    .select(`
      event_id,
      events(id, name, type, status)
    `)
    .eq('student_id', params.id)
    .order('event_id')

  // Results
  const { data: results, error: resultsError } = await supabase
    .from('results')
    .select(`
      event_id,
      rank,
      points_earned,
      events(id, name, type, point_multiplier)
    `)
    .eq('student_id', params.id)
    .order('rank')

  console.log('Results data:', results, 'Error:', resultsError)

  const totalPoints = student.total_points || 0
  const goldCount = results?.filter((r: any) => Number(r.rank) === 1).length || 0
  const silverCount = results?.filter((r: any) => Number(r.rank) === 2).length || 0
  const bronzeCount = results?.filter((r: any) => Number(r.rank) === 3).length || 0

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <Link
        href="/students"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-xs font-semibold text-[#d4e4fa]"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#ffb95f]" />
        Back to Athletes
      </Link>

      {/* Profile Card */}
      <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {student.photo_url ? (
              <Image
                src={student.photo_url}
                alt={student.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-5 h-5 text-[#909097]" />
            )}
          </div>
          {/* Info */}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#d4e4fa] tracking-tight">{student.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 select-none text-[10px]">
              <span className="text-[#909097] font-semibold bg-white/5 px-1.5 py-0.5 rounded">DOB: {student.class || 'N/A'}</span>
              <span className="text-[#ffb95f] font-semibold bg-[#ffb95f]/10 border border-[#ffb95f]/20 px-1.5 py-0.5 rounded">
                {student.category}
              </span>
              {student.groups && (
                <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: student.groups?.color || '#909097' }}
                  />
                  <span className="text-[#909097] font-semibold">{student.groups?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-6 border-t border-white/5 text-center select-none">
          <div>
            <p className="text-xl font-bold text-[#ffb95f]">{totalPoints % 1 === 0 ? totalPoints : totalPoints.toFixed(1)}</p>
            <p className="text-[9px] text-[#909097] font-bold uppercase tracking-wider mt-1">Total Pts</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#ffb95f]">🥇 {goldCount}</p>
            <p className="text-[9px] text-[#909097] font-bold uppercase tracking-wider mt-1">Gold</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#bec6e0]">🥈 {silverCount}</p>
            <p className="text-[9px] text-[#909097] font-bold uppercase tracking-wider mt-1">Silver</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#e7a066]">🥉 {bronzeCount}</p>
            <p className="text-[9px] text-[#909097] font-bold uppercase tracking-wider mt-1">Bronze</p>
          </div>
        </div>
      </div>

      {/* Results History */}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none pl-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#ffb95f]" />
            Official Podium Finishes
          </h2>
          <div className="space-y-2">
            {results.map((r: any, i: number) => {
              const medal = Number(r.rank) === 1 ? '🥇' : Number(r.rank) === 2 ? '🥈' : '🥉'
              const colorClass = Number(r.rank) === 1 ? 'text-[#ffb95f]' : Number(r.rank) === 2 ? 'text-[#bec6e0]' : 'text-[#e7a066]'
              return (
                <div key={i} className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-base select-none">{medal}</span>
                    <div>
                      <p className="text-xs font-bold text-[#d4e4fa]">{r.events?.name}</p>
                      <p className="text-[10px] text-[#909097] capitalize mt-0.5">{r.events?.type} event</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-black', colorClass)}>
                    +{r.points_earned} pts
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Participations History */}
      {participations && participations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none pl-1 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#7bd0ff]" />
            Event participations ({participations.length})
          </h2>
          <div className="space-y-2">
            {participations.map((p: any, i: number) => {
              const result = results?.find((r: any) => r.event_id === p.event_id)
              const medal = result ? (Number(result.rank) === 1 ? '🥇' : Number(result.rank) === 2 ? '🥈' : '🥉') : null
              const rankLabel = result ? (Number(result.rank) === 1 ? '1st' : Number(result.rank) === 2 ? '2nd' : '3rd') : null

              return (
                <Link
                  key={i}
                  href={`/events/${p.event_id}`}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10 active:scale-[0.99] transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-[#d4e4fa]">{p.events?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#909097] capitalize">{p.events?.type} event</span>
                      {result && (
                        <span className="text-[10px] text-[#ffb95f] font-semibold flex items-center gap-0.5">
                          • {medal} {rankLabel} (+{result.points_earned} pts)
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase select-none',
                      p.events?.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}
                  >
                    {p.events?.status}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
