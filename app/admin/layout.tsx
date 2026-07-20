import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MobileAppShell } from '@/components/layout/MobileAppShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || null
  if (role !== 'super_admin') {
    redirect('/')
  }

  return (
    <MobileAppShell userEmail={user.email}>
      {children}
    </MobileAppShell>
  )
}
