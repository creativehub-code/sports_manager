import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // 4. Fetch all schools (using select('*') to handle address presence dynamically)
    const { data: schools, error: schoolsErr } = await supabase
      .from('schools')
      .select('*')
      .order('name')

    if (schoolsErr) {
      return NextResponse.json({ error: schoolsErr.message }, { status: 500 })
    }

    // 5. Fetch all students to count athletes and group them by school ID
    const { data: students, error: studentsErr } = await supabase
      .from('students')
      .select('id, school_id')

    if (studentsErr) {
      return NextResponse.json({ error: studentsErr.message }, { status: 500 })
    }

    const totalSchools = schools.length
    const totalAthletes = students?.length || 0

    // Map of school_id -> athlete count
    const athleteCounts: Record<string, number> = {}
    students?.forEach((s: any) => {
      if (s.school_id) {
        athleteCounts[s.school_id] = (athleteCounts[s.school_id] || 0) + 1
      }
    })

    // 6. Fetch all users from Supabase Auth in pages to build email mapping
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000
    let hasMore = true

    while (hasMore) {
      const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage,
      })

      if (usersErr || !users || users.length === 0) {
        hasMore = false
      } else {
        allUsers = allUsers.concat(users)
        if (users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    // Map school_id -> admin email
    const schoolAdminMap: Record<string, string> = {}
    allUsers.forEach((u) => {
      const userRole = u.user_metadata?.role || 'school_admin'
      const userSchoolId = u.user_metadata?.school_id
      if (userRole === 'school_admin' && userSchoolId) {
        // If multiple admins, we keep the first one found or we can overwrite
        schoolAdminMap[userSchoolId] = u.email || ''
      }
    })

    // 7. Assemble the final schools info list
    const schoolsInfo = schools.map((school: any) => ({
      id: school.id,
      name: school.name,
      logo_url: school.logo_url,
      // Handle the case where the SQL migration hasn't run yet, preventing a crash
      address: 'address' in school ? school.address : null,
      adminEmail: schoolAdminMap[school.id] || null,
      athleteCount: athleteCounts[school.id] || 0,
      created_at: school.created_at,
    }))

    return NextResponse.json({
      totalSchools,
      totalAthletes,
      schoolsInfo,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
