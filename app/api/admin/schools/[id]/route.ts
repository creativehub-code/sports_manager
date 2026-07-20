import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolId = params.id

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    // 1. Verify caller session using server-side auth client
    const authClient = createClient()
    const { data: { user: currentUser } } = await authClient.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Security Check: verify the user is a super admin
    const role = currentUser.user_metadata?.role || null
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    // 3. Create service client for administrative operations
    const supabase = createServiceClient()

    // 4. Fetch all users from Supabase Auth to find admins of this school
    let page = 1
    const perPage = 1000
    let hasMore = true
    const usersToDelete: string[] = []

    while (hasMore) {
      const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage,
      })

      if (usersErr || !users || users.length === 0) {
        hasMore = false
      } else {
        users.forEach((u) => {
          if (u.user_metadata?.school_id === schoolId) {
            usersToDelete.push(u.id)
          }
        })

        if (users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    // 5. Delete all matching users
    const deleteUserPromises = usersToDelete.map((userId) => 
      supabase.auth.admin.deleteUser(userId)
    )
    const deleteResults = await Promise.allSettled(deleteUserPromises)
    
    // Check if there were any critical errors deleting users (optional, we could proceed even if some fail)
    const failedDeletes = deleteResults.filter(r => r.status === 'rejected')
    if (failedDeletes.length > 0) {
      console.error(`Failed to delete ${failedDeletes.length} users associated with school ${schoolId}.`)
    }

    // 6. Delete the school from the public schema
    const { error: schoolDeleteErr } = await supabase
      .from('schools')
      .delete()
      .eq('id', schoolId)

    if (schoolDeleteErr) {
      return NextResponse.json({ error: schoolDeleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedUsersCount: usersToDelete.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
