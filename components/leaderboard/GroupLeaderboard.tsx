'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RefreshCw, Download, Printer, Medal, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GroupLeaderboardEntry } from '@/lib/types'

interface GroupLeaderboardProps {
  initialData: GroupLeaderboardEntry[]
}

export function GroupLeaderboard({ initialData }: GroupLeaderboardProps) {
  const supabase = createClient()
  const [data, setData] = useState<GroupLeaderboardEntry[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: groups, error } = await supabase
        .from('group_leaderboard_view')
        .select('*')

      if (error) throw error

      const entries = ((groups as any[]) || []).map((g) => ({
        group_id: g.id,
        group_name: g.name,
        group_color: g.color,
        total_points: g.total_points || 0,
        gold_count: g.gold_count || 0,
        silver_count: g.silver_count || 0,
        bronze_count: g.bronze_count || 0,
      })).sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
        if (b.gold_count !== a.gold_count) return b.gold_count - a.gold_count
        if (b.silver_count !== a.silver_count) return b.silver_count - a.silver_count
        return b.bronze_count - a.bronze_count
      })

      setData(entries)
      setLastUpdated(new Date())
    } catch (err: any) {
      toast.error('Failed to load: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('group-leaderboard-results')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, supabase])

  async function handleExport() {
    try {
      const res = await fetch('/api/export/group')
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `group-leaderboard-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      toast.success('Leaderboard exported to Excel')
    } catch {
      toast.error('Failed to export leaderboard')
    }
  }

  const firstPlace = data[0]
  const runnerUps = data.slice(1)

  return (
    <div className="space-y-6 pb-20">
      
      {/* Controls / Subheader */}
      <div className="flex items-center justify-between no-print select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-[#909097] uppercase tracking-widest">
            Live Feed {mounted && `· Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </span>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-full bg-white/5 border border-white/5 text-[#909097] hover:text-[#d4e4fa] disabled:opacity-30 transition-all"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-full bg-white/5 border border-white/5 text-[#909097] hover:text-[#d4e4fa] transition-all"
            title="Print Standings"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-full bg-white/5 border border-white/5 text-[#909097] hover:text-[#ffb95f] transition-all"
            title="Export Standings"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* #1 Winner Podium Box */}
      {firstPlace && (
        <div className="glass-card rounded-[28px] p-6 relative overflow-hidden border-[#ffb95f]/30">
          {/* Radial Glow Overlay */}
          <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-[#ffb95f]/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb95f] bg-[#ffb95f]/10 border border-[#ffb95f]/20 px-2 py-0.5 rounded-full select-none flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Leaderboard Champion
            </span>
            <div className="text-3xl font-black text-[#ffb95f]">#1</div>
          </div>

          <div className="text-center my-6">
            <div className="flex justify-center mb-3">
              <div
                className="w-16 h-16 rounded-3xl border border-white/10 flex items-center justify-center relative shadow-inner"
                style={{ backgroundColor: firstPlace.group_color || '#ffb95f' }}
              >
                <Medal className="w-8 h-8 text-black/60" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#d4e4fa] tracking-tight">{firstPlace.group_name}</h2>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-4xl font-extrabold text-[#ffb95f] tracking-tight">
                {firstPlace.total_points % 1 === 0 ? firstPlace.total_points : firstPlace.total_points.toFixed(1)}
              </span>
              <span className="text-xs text-[#909097] font-semibold">Total Points</span>
            </div>
          </div>

          {/* Medals list summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl text-center select-none text-xs">
            <div>
              <p className="text-base">🥇</p>
              <p className="font-bold text-[#ffb95f] mt-1">{firstPlace.gold_count} Gold</p>
            </div>
            <div>
              <p className="text-base">🥈</p>
              <p className="font-bold text-[#bec6e0] mt-1">{firstPlace.silver_count} Silver</p>
            </div>
            <div>
              <p className="text-base">🥉</p>
              <p className="font-bold text-[#e7a066] mt-1">{firstPlace.bronze_count} Bronze</p>
            </div>
          </div>
        </div>
      )}

      {/* Other Standings List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none pl-1">
          Group Rankings
        </h3>

        {data.length <= 1 && runnerUps.length === 0 ? (
          <div className="glass-card rounded-[24px] py-12 flex flex-col items-center justify-center text-center">
            <Shield className="w-8 h-8 text-[#909097] opacity-40 mb-2" />
            <p className="text-sm font-semibold text-[#d4e4fa]">No groups found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
            {runnerUps.map((entry, idx) => {
              const rank = idx + 2
              return (
                <div
                  key={entry.group_id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank bubble */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none border',
                        rank === 2
                          ? 'bg-[#bec6e0]/10 border-[#bec6e0]/20 text-[#bec6e0]'
                          : rank === 3
                          ? 'bg-[#e7a066]/10 border-[#e7a066]/20 text-[#e7a066]'
                          : 'bg-white/5 border-white/5 text-[#909097]'
                      )}
                    >
                      {rank}
                    </div>

                    {/* Color badge & name */}
                    <div
                      className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
                      style={{ backgroundColor: entry.group_color || '#909097' }}
                    />
                    <span className="text-xs font-bold text-[#d4e4fa]">{entry.group_name}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Medals summary */}
                    <div className="flex gap-2 text-[10px] select-none">
                      <span className="font-semibold text-[#ffb95f]">🥇 {entry.gold_count}</span>
                      <span className="font-semibold text-[#bec6e0]">🥈 {entry.silver_count}</span>
                      <span className="font-semibold text-[#e7a066]">🥉 {entry.bronze_count}</span>
                    </div>

                    {/* Points total */}
                    <div className="text-right flex-shrink-0 min-w-[50px]">
                      <span className="text-xs font-black text-[#d4e4fa]">
                        {entry.total_points % 1 === 0 ? entry.total_points : entry.total_points.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-[#909097] block font-semibold mt-0.5">pts</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
