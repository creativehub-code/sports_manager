import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventDetailClient } from '@/components/events/EventDetailClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Event Detail' }

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [
    { data: event, error },
    { data: participants },
    { data: results },
    { data: students },
    { data: groups },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).single(),
    supabase
      .from('participants')
      .select(`
        *,
        students(id, name, class, category),
        groups(id, name, color)
      `)
      .eq('event_id', params.id)
      .order('id'),
    supabase
      .from('results')
      .select(`
        *,
        students(id, name, class),
        groups(id, name, color)
      `)
      .eq('event_id', params.id)
      .order('rank'),
    supabase.from('students').select('*').order('name'),
    supabase.from('groups').select('*').order('name'),
  ])

  if (error || !event) notFound()

  return (
    <EventDetailClient
      event={event}
      initialParticipants={participants || []}
      initialResults={results || []}
      allStudents={students || []}
      allGroups={groups || []}
    />
  )
}
