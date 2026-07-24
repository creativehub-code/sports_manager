'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Shield } from 'lucide-react'
import { GroupForm } from './GroupForm'
import type { Group } from '@/lib/types'

interface GroupTableProps {
  initialGroups: Group[]
}

export function GroupTable({ initialGroups }: GroupTableProps) {
  const supabase = createClient()
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditTarget(null)
    setDialogMode('create')
  }

  function openEdit(group: Group) {
    setEditTarget(group)
    setDialogMode('edit')
  }

  async function refetch() {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('name')
    setGroups(data || [])
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('groups').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Cannot delete group: ' + error.message)
    } else {
      toast.success(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      refetch()
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#909097] select-none">
            Group configuration
          </h2>
          <p className="text-xs text-[#909097]/80 mt-1 select-none">
            {groups.length} active house{groups.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-full action-btn-primary text-xs flex items-center gap-1.5 select-none"
        >
          <Plus className="w-3.5 h-3.5 text-[#2a1700]" />
          New Group
        </button>
      </div>

      {/* Grid of House Cards */}
      {groups.length === 0 ? (
        <div className="glass-card rounded-[24px] py-16 flex flex-col items-center justify-center text-center">
          <Shield className="w-8 h-8 text-[#909097] opacity-40 mb-2" />
          <p className="text-sm font-semibold text-[#d4e4fa]">No groups configured</p>
          <p className="text-xs text-[#909097] mt-1">Configure your first house to organize athletes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="glass-card rounded-[24px] p-5 flex flex-col justify-between h-[156px] border-white/5 hover:border-[#ffb95f]/15 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex-shrink-0 border border-white/10 shadow-inner"
                  style={{ backgroundColor: group.color || '#909097' }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#d4e4fa] truncate">{group.name}</p>
                  {group.color && (
                    <p className="text-[10px] text-[#909097] font-mono mt-0.5 uppercase">
                      {group.color}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2 select-none border-t border-white/5 pt-3">
                <button
                  onClick={() => openEdit(group)}
                  className="flex-1 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-[#d4e4fa] transition-all flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3 text-[#ffb95f]" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(group)}
                  className="p-2 rounded-full bg-white/5 hover:bg-red-500/10 text-[#909097] hover:text-red-400 transition-all flex items-center justify-center"
                  title="Delete Group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog Modal */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#909097] mb-4">
              {dialogMode === 'create' ? 'Create Group' : 'Edit Group'}
            </h2>
            <GroupForm
              group={editTarget || undefined}
              onSuccess={() => {
                setDialogMode(null)
                refetch()
              }}
              onCancel={() => setDialogMode(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1a2c] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h2 className="text-base font-bold uppercase tracking-wider text-red-400 mb-2">Delete Group</h2>
            <p className="text-xs text-[#909097] leading-relaxed mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#d4e4fa]">"{deleteTarget.name}"</span>?
              Associated students will be unassigned from this house. This cannot be undone.
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
