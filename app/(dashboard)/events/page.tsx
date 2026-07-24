import { createClient } from '@/lib/supabase/server'
import { EventTable } from '@/components/events/EventTable'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Events' }

export default async function EventsPage() {
  const supabase = createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return <EventTable initialEvents={events || []} />
}
