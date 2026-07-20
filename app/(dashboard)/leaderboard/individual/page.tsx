import { IndividualLeaderboard } from '@/components/leaderboard/IndividualLeaderboard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Individual Leaderboard' }

export default function IndividualLeaderboardPage() {
  return <IndividualLeaderboard initialData={[]} initialCategory="All" />
}
