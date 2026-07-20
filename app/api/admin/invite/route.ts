import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const authClient = createClient()
    const { data: { user: currentUser } } = await authClient.auth.getUser()

    if (!currentUser || currentUser.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, schoolId } = await request.json()
    if (!email || !schoolId) {
      return NextResponse.json({ error: 'Email and School ID are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Determine absolute origin of this request to build correct redirectTo link
    const origin = new URL(request.url).origin

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/api/auth/callback?next=/update-password`,
      data: {
        school_id: schoolId,
        role: 'school_admin',
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
