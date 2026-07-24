import { createClient } from '@/lib/supabase/server'
import { GroupLeaderboard } from '@/components/leaderboard/GroupLeaderboard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Group Leaderboard' }

export default async function GroupLeaderboardPage() {
  const supabase = createClient()
  const { data: groups } = await supabase
    .from('group_leaderboard_view')
    .select('*')

  const initialData = (groups || []).map((g: any) => ({
    group_id: g.id,
    group_name: g.name,
    group_color: g.color,
    total_points: g.total_points || 0,
    gold_count: g.gold_count || 0,
    silver_count: g.silver_count || 0,
    bronze_count: g.bronze_count || 0,
  })).sort((a: any, b: any) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.gold_count !== a.gold_count) return b.gold_count - a.gold_count
    if (b.silver_count !== a.silver_count) return b.silver_count - a.silver_count
    return b.bronze_count - a.bronze_count
  })

  return <GroupLeaderboard initialData={initialData} />
}
