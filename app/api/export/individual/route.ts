import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'
import type { Category } from '@/lib/types'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') as Category | null
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

  // Fetch school name
  let schoolName = 'All Schools'
  if (schoolId) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single()
    schoolName = (school as any)?.name || 'School'
  }

  // Fetch all results for individual events scoped by school_id if set
  let dbQuery = supabase
    .from('results')
    .select(`
      student_id,
      rank,
      points_earned,
      students!inner(id, name, class, category, school_id, groups(name, color))
    `)
    .not('student_id', 'is', null)

  if (schoolId) {
    dbQuery = dbQuery.eq('students.school_id', schoolId)
  }

  const { data: rows, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  interface IndividualResultRow {
    student_id: string
    rank: number
    points_earned: number
    students: {
      id: string
      name: string
      class: string
      category: string
      groups: { name: string; color: string | null } | null
    }
  }

  // Aggregate
  const map: Record<string, {
    name: string; class: string; category: string; group: string;
    total: number; gold: number; silver: number; bronze: number
  }> = {}

  for (const row of (rows as unknown as IndividualResultRow[]) || []) {
    const sid = row.student_id
    if (!map[sid]) {
      map[sid] = {
        name: row.students.name,
        class: row.students.class,
        category: row.students.category,
        group: row.students.groups?.name || '—',
        total: 0, gold: 0, silver: 0, bronze: 0,
      }
    }
    map[sid].total += row.points_earned
    if (row.rank === 1) map[sid].gold++
    if (row.rank === 2) map[sid].silver++
    if (row.rank === 3) map[sid].bronze++
  }

  let entries = Object.values(map)
  if (category) entries = entries.filter((e) => e.category === category)
  entries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.gold !== a.gold) return b.gold - a.gold
    if (b.silver !== a.silver) return b.silver - a.silver
    return b.bronze - a.bronze
  })

  // Build Excel
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Athlead'
  const sheet = workbook.addWorksheet('Individual Leaderboard')

  // Title
  sheet.mergeCells('A1:I1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `${schoolName} — Individual Leaderboard${category ? ` (${category})` : ''}`
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  // Header row
  sheet.addRow([])
  const headers = ['Rank', 'Name', 'Class', 'Category', 'Group', 'Gold 🥇', 'Silver 🥈', 'Bronze 🥉', 'Total Points']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }
    cell.border = { bottom: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  // Data rows
  entries.forEach((entry, idx) => {
    const row = sheet.addRow([
      idx + 1,
      entry.name,
      entry.class,
      entry.category,
      entry.group,
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

  // Column widths
  sheet.columns = [
    { width: 8 }, { width: 25 }, { width: 10 }, { width: 14 },
    { width: 16 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 14 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="individual-leaderboard-${schoolName.toLowerCase().replace(/\s+/g, '-')}.xlsx"`,
    },
  })
}
