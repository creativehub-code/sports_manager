import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const authClient = createClient()
    const { data: { user: currentUser } } = await authClient.auth.getUser()

    if (!currentUser || currentUser.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map user attributes and filter to admin / school admin roles
    const mappedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || 'school_admin',
      schoolId: u.user_metadata?.school_id || null,
      lastSignIn: u.last_sign_in_at,
      created_at: u.created_at,
      invited_at: u.invited_at,
      confirmed_at: u.email_confirmed_at,
    }))

    // Fetch all schools via service client to bypass RLS
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('*')
      .order('name')

    return NextResponse.json({ users: mappedUsers, schools: schoolsData || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
