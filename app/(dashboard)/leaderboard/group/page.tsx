import { GroupLeaderboard } from '@/components/leaderboard/GroupLeaderboard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Group Leaderboard' }

export default function GroupLeaderboardPage() {
  return <GroupLeaderboard initialData={[]} />
}
