'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Search,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Camera,
  Plus,
} from 'lucide-react'
import { StudentForm } from './StudentForm'
import { CSVUpload } from './CSVUpload'
import { cn } from '@/lib/utils'
import type { Student, Group, Category } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'

const CATEGORIES: Category[] = ['Sub Junior', 'Junior', 'Senior']
const PAGE_SIZE = 20

interface StudentTableProps {
  initialStudents: Student[]
  groups: Group[]
}

export function StudentTable({ initialStudents, groups }: StudentTableProps) {
  const supabase = createClient()

  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [page, setPage] = useState(0)

  const [dialogMode, setDialogMode] = useState<'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  async function refetch() {
    const { data } = await supabase
      .from('students')
      .select(`
        *,
        groups(id, name, color),
        participation_count:participants(count)
      `)
      .order('name')
    setStudents(
      (data || []).map((s: any) => ({
        ...s,
        participation_count: s.participation_count?.[0]?.count ?? 0,
      }))
    )
  }

  // Filtering
  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase()) ||
      (s.groups?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter
    return matchSearch && matchCat
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Delete failed: ' + error.message)
    } else {
      toast.success(`"${deleteTarget.name}" removed`)
      setDeleteTarget(null)
      refetch()
    }
    setDeleting(false)
  }

  return (
    <div className="pb-20">
      
      {showCreate && (
        <div className="space-y-4 animate-fade-in mb-6">
          <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#909097] select-none">
                Add Athlete
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-xs font-semibold text-[#ffb95f] hover:underline select-none"
              >
                Close Form
              </button>
            </div>
            <StudentForm
              groups={groups}
              onSuccess={() => {
                refetch()
                setShowCreate(false)
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>

          {/* OR Divider (Image 1 middle part) */}
          <div className="flex items-center gap-4 py-2 select-none">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-xs font-bold text-[#909097]">OR</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {/* CSV Upload inline (Image 1 bottom part) */}
          <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
            <CSVUpload
              groups={groups}
              onSuccess={() => {
                refetch()
                setShowCreate(false)
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-28 right-6 sm:right-[calc(50vw-216px)] z-40 w-14 h-14 rounded-full action-btn-primary flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 select-none"
          title="Add New Athlete"
        >
          <Plus className="w-6 h-6 text-[#2a1700]" />
        </button>
      )}

      {/* Registered Athletes List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">
            Registered Athletes ({filtered.length})
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#909097]" />
            <input
              type="text"
              placeholder="Search athletes…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-10 pr-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(0) }}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
                  categoryFilter === cat
                    ? 'bg-[#ffb95f]/10 border-[#ffb95f]/40 text-[#ffb95f]'
                    : 'border-white/5 text-[#909097] hover:text-[#d4e4fa] hover:border-white/10'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of athletes in beautiful glass cards */}
        {paginated.length === 0 ? (
          <div className="glass-card rounded-[24px] py-12 flex flex-col items-center justify-center text-center">
            <Users className="w-8 h-8 text-[#909097] opacity-40 mb-2" />
            <p className="text-sm font-semibold text-[#d4e4fa]">No athletes found</p>
            <p className="text-xs text-[#909097] mt-1">Try adjusting search query or filter tags</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((student) => (
              <div
                key={student.id}
                className="glass-card rounded-[24px] p-4 flex items-center justify-between border-white/5 hover:border-[#ffb95f]/15"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {student.photo_url ? (
                      <Image
                        src={student.photo_url}
                        alt={student.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-4 h-4 text-[#909097]" />
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/students/${student.id}`}
                      className="text-sm font-semibold text-[#d4e4fa] hover:text-[#ffb95f] transition-colors"
                    >
                      {student.name}
                    </Link>
                    <p className="text-xs text-[#909097] mt-0.5">
                      DOB: {student.class || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {student.groups && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: student.groups.color ? `${student.groups.color}40` : 'rgba(255,255,255,0.1)',
                        backgroundColor: student.groups.color ? `${student.groups.color}10` : 'rgba(255,255,255,0.05)',
                        color: student.groups.color || '#909097',
                      }}
                    >
                      {student.groups.name}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditTarget(student); setDialogMode('edit') }}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#909097] hover:text-[#d4e4fa] active:scale-90 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(student)}
                      className="p-2 rounded-full bg-white/5 hover:bg-red-500/10 text-[#909097] hover:text-red-400 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] font-semibold text-[#909097]">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-full bg-white/5 border border-white/5 text-[#909097] hover:text-[#d4e4fa] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-full bg-white/5 border border-white/5 text-[#909097] hover:text-[#d4e4fa] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal (DialogMode === 'edit') */}
      {dialogMode === 'edit' && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in my-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#909097] mb-4">
              Edit Athlete
            </h2>
            <StudentForm
              student={editTarget}
              groups={groups}
              onSuccess={() => { setDialogMode(null); refetch() }}
              onCancel={() => setDialogMode(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-red-400 mb-2">Delete Athlete</h2>
            <p className="text-xs text-[#909097] leading-relaxed mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#d4e4fa]">"{deleteTarget.name}"</span>?
              This action is permanent and removes all associated results.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#d4e4fa] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
