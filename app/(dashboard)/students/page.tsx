import { createClient } from '@/lib/supabase/server'
import { StudentTable } from '@/components/students/StudentTable'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Students' }

export default async function StudentsPage() {
  const supabase = createClient()

  const [{ data: students }, { data: groups }] = await Promise.all([
    supabase
      .from('students')
      .select(`
        *,
        groups(id, name, color),
        participation_count:participants(count)
      `)
      .order('name'),
    supabase.from('groups').select('*').order('name'),
  ])

  const normalized = (students || []).map((s: any) => ({
    ...s,
    participation_count: s.participation_count?.[0]?.count ?? 0,
  }))

  return <StudentTable initialStudents={normalized} groups={groups || []} />
}
