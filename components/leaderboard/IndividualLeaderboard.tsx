'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RefreshCw, Download, Printer, Trophy } from 'lucide-react'
import { cn, getCategoryColor } from '@/lib/utils'
import type { IndividualLeaderboardEntry, Category } from '@/lib/types'

const CATEGORIES: Category[] = ['Sub Junior', 'Junior', 'Senior']

interface IndividualLeaderboardProps {
  initialData: IndividualLeaderboardEntry[]
  initialCategory: Category | 'All'
}

export function IndividualLeaderboard({
  initialData,
  initialCategory,
}: IndividualLeaderboardProps) {
  const supabase = createClient()
  const [data, setData] = useState<IndividualLeaderboardEntry[]>(initialData)
  const [category, setCategory] = useState<Category | 'All'>(initialCategory)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = useCallback(
    async (cat: Category | 'All' = category) => {
      setLoading(true)
      try {
        // Aggregate via Supabase
        let query = supabase
          .from('results')
          .select(`
            student_id,
            rank,
            points_earned,
            students!inner(id, name, class, category, groups(name, color))
          `)
          .not('student_id', 'is', null)

        const { data: rows, error } = await query
        if (error) throw error

        // Aggregate in JS
        const map: Record<string, IndividualLeaderboardEntry> = {}
        for (const row of (rows as any[]) || []) {
          const sid = row.student_id
          if (!map[sid]) {
            map[sid] = {
              student_id: sid,
              student_name: row.students.name,
              class: row.students.class,
              category: row.students.category,
              group_name: row.students.groups?.name || null,
              group_color: row.students.groups?.color || null,
              total_points: 0,
              gold_count: 0,
              silver_count: 0,
              bronze_count: 0,
            }
          }
          map[sid].total_points += row.points_earned
          if (row.rank === 1) map[sid].gold_count++
          if (row.rank === 2) map[sid].silver_count++
          if (row.rank === 3) map[sid].bronze_count++
        }

        let entries = Object.values(map)

        // Filter by category
        if (cat !== 'All') {
          entries = entries.filter((e) => e.category === cat)
        }

        // Sort: total DESC, gold DESC, silver DESC, bronze DESC
        entries.sort((a, b) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points
          if (b.gold_count !== a.gold_count) return b.gold_count - a.gold_count
          if (b.silver_count !== a.silver_count) return b.silver_count - a.silver_count
          return b.bronze_count - a.bronze_count
        })

        setData(entries.slice(0, 50))
        setLastUpdated(new Date())
      } catch (err: any) {
        toast.error('Failed to load leaderboard: ' + err.message)
      } finally {
        setLoading(false)
      }
    },
    [category, supabase]
  )

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('individual-leaderboard-results')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          fetchData(category)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [category, fetchData, supabase])

  // Refetch when category changes
  useEffect(() => {
    fetchData(category)
  }, [category])

  function handleCategoryChange(cat: Category | 'All') {
    setCategory(cat)
  }

  async function handleExport() {
    const params = new URLSearchParams()
    if (category !== 'All') params.set('category', category)
    const res = await fetch(`/api/export/individual?${params}`)
    if (!res.ok) {
      toast.error('Export failed')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `individual-leaderboard${category !== 'All' ? `-${category.replace(' ', '-')}` : ''}.xlsx`
    a.click()
    toast.success('Exported!')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Individual Champion List</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Top performers by total points from individual events
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fetchData(category)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export XLSX
          </button>
        </div>
      </div>

      {/* Print title (hidden on screen) */}
      <div className="print-title hidden">Individual Champion List — Sports Manager</div>

      {/* Category Filter */}
      <div className="flex gap-1.5 flex-wrap no-print">
        {(['All', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              category === cat
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Realtime indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground no-print">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Live · Updated {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl text-muted-foreground">
          <Trophy className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No results yet</p>
          <p className="text-sm mt-1">Enter results in events to see the leaderboard</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" id="leaderboard-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">🥇</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">🥈</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">🥉</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((entry, idx) => (
                  <tr
                    key={entry.student_id}
                    className={cn(
                      'hover:bg-muted/20 transition-colors',
                      idx === 0 && 'bg-primary/5',
                      idx === 1 && 'bg-muted/10',
                      idx === 2 && 'bg-orange-500/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          idx === 0 ? 'medal-gold' : idx === 1 ? 'medal-silver' : idx === 2 ? 'medal-bronze' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.student_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{entry.class}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', getCategoryColor(entry.category))}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.group_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.group_color || '#64748b' }} />
                          <span className="text-sm text-muted-foreground">{entry.group_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-400">{entry.gold_count || '—'}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-400">{entry.silver_count || '—'}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-orange-400">{entry.bronze_count || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-primary">
                        {entry.total_points % 1 === 0 ? entry.total_points : entry.total_points.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
