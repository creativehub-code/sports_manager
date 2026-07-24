import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const role = user.user_metadata?.role || null
  let schoolId = user.user_metadata?.school_id || null

  if (role === 'super_admin') {
    const querySchoolId = searchParams.get('schoolId')
    if (querySchoolId) {
      schoolId = querySchoolId === 'all' ? null : querySchoolId
    } else {
      const cookieStore = cookies()
      const activeSchoolCookie = cookieStore.get('x-active-school-id')?.value
      if (activeSchoolCookie && activeSchoolCookie !== 'all') {
        schoolId = activeSchoolCookie
      } else {
        schoolId = null
      }
    }
  }

  const supabase = createServiceClient()

  // Fetch school details for title
  let schoolName = 'All Schools'
  if (schoolId) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single()
    schoolName = (school as any)?.name || 'School'
  }

  // Fetch group event results scoped by school_id if set
  let dbQuery = supabase
    .from('results')
    .select(`
      group_id,
      rank,
      points_earned,
      groups!inner(id, name, color, school_id),
      events!inner(type, school_id)
    `)
    .not('group_id', 'is', null)
    .eq('events.type', 'group')

  if (schoolId) {
    dbQuery = dbQuery.eq('events.school_id', schoolId)
  }

  const { data: rows, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also get all groups for this school (or all schools) for 0-point entries
  let groupsQuery = supabase.from('groups').select('*')
  if (schoolId) {
    groupsQuery = groupsQuery.eq('school_id', schoolId)
  }
  const { data: allGroups } = await groupsQuery

  interface GroupResultRow {
    group_id: string
    rank: number
    points_earned: number
    groups: { id: string; name: string; color: string | null }
  }

  const map: Record<string, {
    name: string; color: string | null;
    total: number; gold: number; silver: number; bronze: number
  }> = {}

  for (const g of (allGroups as any) || []) {
    map[g.id] = { name: g.name, color: g.color, total: 0, gold: 0, silver: 0, bronze: 0 }
  }

  for (const row of (rows as unknown as GroupResultRow[]) || []) {
    const gid = row.group_id
    if (!map[gid]) {
      map[gid] = { name: row.groups.name, color: row.groups.color, total: 0, gold: 0, silver: 0, bronze: 0 }
    }
    map[gid].total += row.points_earned
    if (row.rank === 1) map[gid].gold++
    if (row.rank === 2) map[gid].silver++
    if (row.rank === 3) map[gid].bronze++
  }

  const entries = Object.values(map).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.gold !== a.gold) return b.gold - a.gold
    if (b.silver !== a.silver) return b.silver - a.silver
    return b.bronze - a.bronze
  })

  // Build Excel
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Athlead'
  const sheet = workbook.addWorksheet('Group Leaderboard')

  sheet.mergeCells('A1:G1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `${schoolName} — Group Leaderboard`
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  sheet.addRow([])
  const headers = ['Rank', 'Group / House', 'Gold 🥇', 'Silver 🥈', 'Bronze 🥉', 'Total Points']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }
    cell.border = { bottom: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  entries.forEach((entry, idx) => {
    const row = sheet.addRow([
      idx + 1,
      entry.name,
      entry.gold,
      entry.silver,
      entry.bronze,
      entry.total % 1 === 0 ? entry.total : parseFloat(entry.total.toFixed(1)),
    ])
    if (idx % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
  })

  sheet.columns = [
    { width: 8 }, { width: 25 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 16 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="group-leaderboard-${schoolName.toLowerCase().replace(/\s+/g, '-')}.xlsx"`,
    },
  })
}
