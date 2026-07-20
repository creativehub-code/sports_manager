import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Users, CalendarDays, Shield, Trophy, ChevronRight, Sparkles, PlusCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import { formatPoints } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || null
  let schoolId = user.user_metadata?.school_id || null

  if (role === 'super_admin') {
    const cookieStore = cookies()
    const stored = cookieStore.get('super_admin_active_school_id')?.value
    if (stored) {
      schoolId = stored
    } else {
      // Fallback: pick the first school
      const { data: schools } = await supabase.from('schools').select('id').order('name').limit(1)
      if (schools && schools.length > 0) {
        schoolId = (schools[0] as { id: string }).id
      }
    }
  }

  if (!schoolId) {
    if (role === 'super_admin') {
      redirect('/admin')
    }
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <Shield className="w-12 h-12 text-primary/40 mb-3" />
        <h2 className="text-lg font-bold text-[#d4e4fa]">No School Context</h2>
        <p className="text-xs text-[#909097] mt-1 max-w-[280px]">
          Please make sure your account is associated with a school or create a school as a super admin.
        </p>
      </div>
    )
  }

  // Fetch school details
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single()

  const schoolName = (school as { name: string } | null)?.name || 'School Dashboard'

  // Fetch stats and lists in parallel, scoped by schoolId
  const [
    { count: totalStudents },
    _totalGroups,
    _totalEvents,
    { count: openEvents },
    { count: lockedEvents },
    { data: topResults },
    { data: totalPointsData },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('groups').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'open'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'locked'),
    supabase
      .from('results')
      .select(`
        student_id,
        points_earned,
        students!inner(id, name, class, school_id, groups(name, color))
      `)
      .not('student_id', 'is', null)
      .eq('students.school_id', schoolId)
      .order('points_earned', { ascending: false }),
    supabase
      .from('results')
      .select(`
        points_earned,
        events!inner(school_id)
      `)
      .eq('events.school_id', schoolId),
  ])

  // Aggregate student points to find the top performing athlete
  const studentPoints: Record<string, { id: string; name: string; class: string; group: string; color: string | null; points: number }> = {}
  topResults?.forEach((r: any) => {
    const sid = r.student_id
    if (!studentPoints[sid]) {
      studentPoints[sid] = {
        id: r.students?.id || sid,
        name: r.students?.name || 'Unknown Athlete',
        class: r.students?.class || 'N/A',
        group: r.students?.groups?.name || 'No House',
        color: r.students?.groups?.color || null,
        points: 0,
      }
    }
    studentPoints[sid].points += r.points_earned
  })

  const sortedPerformers = Object.values(studentPoints).sort((a, b) => b.points - a.points)
  const topPerformer = sortedPerformers[0] || {
    id: '#',
    name: 'No data yet',
    class: 'N/A',
    group: 'No House',
    color: '#909097',
    points: 0,
  }

  // Calculate sum of points awarded
  const totalPointsAwarded = totalPointsData?.reduce((sum, r) => sum + (r as { points_earned: number }).points_earned, 0) || 0

  return (
    <div className="space-y-6 pb-20">
      {/* School Name & Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#d4e4fa]">Dashboard</h1>
          <p className="text-xs text-primary font-medium mt-0.5">{schoolName}</p>
        </div>
      </div>

      {/* Top Performing Athlete Card */}
      <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-[#ffb95f]/10 blur-3xl pointer-events-none" />
        
        <p className="text-[12px] font-bold uppercase tracking-widest text-[#909097] select-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#ffb95f]" />
          Top Performing Athlete
        </p>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-bold tracking-tight text-[#ffb95f]">
            {formatPoints(topPerformer.points)}
          </span>
          <span className="text-[#d4e4fa] text-sm font-medium">
            Performance Score
          </span>
        </div>

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#bec6e0]/10 border border-[#bec6e0]/20">
              <Trophy className="w-4 h-4 text-[#ffb95f]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#d4e4fa]">
                {topPerformer.name}
              </p>
              <p className="text-xs text-[#909097] mt-0.5">
                {topPerformer.class} · {topPerformer.group}
              </p>
            </div>
          </div>

          <Link
            href={topPerformer.id !== '#' ? `/students/${topPerformer.id}` : '/students'}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-xs font-semibold text-[#d4e4fa]"
          >
            View Profile
            <ChevronRight className="w-3.5 h-3.5 text-[#ffb95f]" />
          </Link>
        </div>
      </div>

      {/* Grid of 4 Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Card 1: Total Athletes */}
        <div className="glass-card rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between h-[156px]">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#bec6e0]/10 border border-[#bec6e0]/25">
              <Users className="w-4 h-4 text-[#7bd0ff]" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#909097] uppercase tracking-wider select-none">
              Total Athletes
            </p>
            <p className="text-2xl font-bold text-[#d4e4fa] tracking-tight mt-1">
              {totalStudents ?? 0}
            </p>
          </div>
          {/* Sparkline wave */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#7bd0ff] stroke-2 fill-none" preserveAspectRatio="none">
              <path d="M0,25 Q15,10 30,20 T60,15 T90,5 T100,8" />
            </svg>
          </div>
        </div>

        {/* Card 2: Active Events */}
        <div className="glass-card rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between h-[156px]">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#bec6e0]/10 border border-[#bec6e0]/25">
              <CalendarDays className="w-4 h-4 text-[#ffb95f]" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#909097] uppercase tracking-wider select-none">
              Active Events
            </p>
            <p className="text-2xl font-bold text-[#d4e4fa] tracking-tight mt-1">
              {openEvents ?? 0}
            </p>
          </div>
          {/* Sparkline wave */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#ffb95f] stroke-2 fill-none" preserveAspectRatio="none">
              <path d="M0,20 Q20,25 40,10 T80,15 T100,5" />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Points */}
        <div className="glass-card rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between h-[156px]">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#bec6e0]/10 border border-[#bec6e0]/25">
              <Shield className="w-4 h-4 text-[#bec6e0]" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#909097] uppercase tracking-wider select-none">
              Total Points
            </p>
            <p className="text-2xl font-bold text-[#d4e4fa] tracking-tight mt-1">
              {formatPoints(totalPointsAwarded)}
            </p>
          </div>
          {/* Sparkline wave */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#bec6e0] stroke-2 fill-none" preserveAspectRatio="none">
              <path d="M0,15 Q30,10 50,22 T80,12 T100,20" />
            </svg>
          </div>
        </div>

        {/* Card 4: Locked Events */}
        <div className="glass-card rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between h-[156px]">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#bec6e0]/10 border border-[#bec6e0]/25">
              <Lock className="w-4 h-4 text-[#909097]" />
            </div>
            <span className="text-[10px] font-bold text-[#7bd0ff] bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 px-1.5 py-0.5 rounded-full select-none">
              Live
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#909097] uppercase tracking-wider select-none">
              Locked Events
            </p>
            <p className="text-2xl font-bold text-[#d4e4fa] tracking-tight mt-1">
              {lockedEvents ?? 0}
            </p>
          </div>
          {/* Sparkline wave */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#7bd0ff] stroke-2 fill-none" preserveAspectRatio="none">
              <path d="M0,20 Q10,5 30,22 T70,8 T100,15" />
            </svg>
          </div>
        </div>

      </div>

      {/* Quick Actions Panel */}
      <div className="space-y-3 pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">
          Quick Actions
        </p>

        <div className="grid grid-cols-1 gap-3">
          
          <Link
            href="/students"
            className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10 transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#bec6e0]/5 border border-white/10 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-[#ffb95f]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d4e4fa]">Add New Athlete</p>
                <p className="text-xs text-[#909097] mt-0.5">Register manually or bulk upload CSV</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#909097] group-hover:text-[#ffb95f] transition-colors" />
          </Link>

          <Link
            href="/events"
            className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10 transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#bec6e0]/5 border border-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#7bd0ff]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d4e4fa]">Manage Events</p>
                <p className="text-xs text-[#909097] mt-0.5">Create and enter official sports results</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#909097] group-hover:text-[#7bd0ff] transition-colors" />
          </Link>

          <Link
            href="/groups"
            className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10 transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#bec6e0]/5 border border-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#bec6e0]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d4e4fa]">Groups / Houses Settings</p>
                <p className="text-xs text-[#909097] mt-0.5">Configure houses, teams, and color tokens</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#909097] group-hover:text-[#bec6e0] transition-colors" />
          </Link>

        </div>
      </div>
    </div>
  )
}
