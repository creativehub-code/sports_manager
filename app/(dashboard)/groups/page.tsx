import { createClient } from '@/lib/supabase/server'
import { GroupTable } from '@/components/groups/GroupTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Groups',
}

export default async function GroupsPage() {
  const supabase = createClient()
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('name')

  return <GroupTable initialGroups={groups || []} />
}
