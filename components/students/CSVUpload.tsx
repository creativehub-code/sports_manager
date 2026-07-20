'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  Loader2,
  X,
  Download,
} from 'lucide-react'
import type { Category, Group } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'

const CATEGORIES: Category[] = ['Sub Junior', 'Junior', 'Senior']

interface CSVRow {
  name: string
  class: string
  category: Category
  group_name: string
  valid: boolean
  error?: string
}

interface CSVUploadProps {
  groups: Group[]
  onSuccess: () => void
  onCancel: () => void
}

export function CSVUpload({ groups, onSuccess, onCancel }: CSVUploadProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const { schoolId } = useAuth()

  const [rows, setRows] = useState<CSVRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')

  function validateRow(raw: Record<string, string>): CSVRow {
    const name = (raw['name'] || '').trim()
    const cls = (raw['class'] || '').trim()
    const cat = (raw['category'] || '').trim() as Category
    const groupName = (raw['group_name'] || '').trim()

    if (!name) return { name, class: cls, category: cat, group_name: groupName, valid: false, error: 'Name is required' }
    if (!cls) return { name, class: cls, category: cat, group_name: groupName, valid: false, error: 'Class/DOB is required' }
    if (!CATEGORIES.includes(cat)) {
      return { name, class: cls, category: cat, group_name: groupName, valid: false, error: `Category must be one of: ${CATEGORIES.join(', ')}` }
    }

    return { name, class: cls, category: cat, group_name: groupName, valid: true }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = (results.data as Record<string, string>[]).map(validateRow)
        setRows(parsed)
        setStep('preview')
      },
      error: (err) => {
        toast.error('CSV parse error: ' + err.message)
      },
    })
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setLoading(true)

    try {
      // Resolve groups — find or create by name
      const groupCache: Record<string, string> = {}
      for (const g of groups) {
        groupCache[g.name.toLowerCase()] = g.id
      }

      // Collect unique group names that need to be created
      const uniqueGroupNames = Array.from(
        new Set(
          validRows
            .map((r) => r.group_name)
            .filter((n) => n && !groupCache[n.toLowerCase()])
        )
      )

      // Create missing groups
      for (const gName of uniqueGroupNames) {
        if (!schoolId) throw new Error('No school context selected')
        const { data: newGroup, error } = await supabase
          .from('groups')
          .insert({ name: gName, school_id: schoolId } as any)
          .select()
          .single()
        if (error) {
          const { data: existing } = await supabase
            .from('groups')
            .select('id')
            .eq('name', gName)
            .single()
          if (existing) groupCache[gName.toLowerCase()] = (existing as any).id
        } else {
          groupCache[gName.toLowerCase()] = (newGroup as any).id
        }
      }

      // Build insert payload
      const payload = validRows.map((row) => ({
        name: row.name,
        class: row.class,
        category: row.category,
        group_id: row.group_name ? groupCache[row.group_name.toLowerCase()] || null : null,
        photo_url: null,
        school_id: schoolId!,
      }))

      // Batch insert in chunks of 100
      const CHUNK = 100
      let inserted = 0
      for (let i = 0; i < payload.length; i += CHUNK) {
        const chunk = payload.slice(i, i + CHUNK)
        const { error } = await supabase.from('students').insert(chunk as any)
        if (error) throw error
        inserted += chunk.length
      }

      toast.success(`Successfully imported ${inserted} student${inserted !== 1 ? 's' : ''}`)
      onSuccess()
    } catch (err: unknown) {
      toast.error('Import failed: ' + ((err as Error).message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const validCount = rows.filter((r) => r.valid).length
  const errorCount = rows.filter((r) => !r.valid).length

  function downloadTemplate() {
    const csv = 'name,class,category,group_name\nArjun Kumar,2010-05-15,Junior,Red House\nPriya Singh,2012-08-20,Sub Junior,Blue House\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'athletes_template.csv'
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#909097] select-none">Bulk Import</h2>
          <p className="text-xs text-[#909097]/80 mt-1 select-none">
            Upload CSV with: name, class, category, group_name
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ffb95f]/30 hover:bg-[#ffb95f]/5 text-xs font-semibold text-[#ffb95f] transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>

      {step === 'upload' ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-[#ffb95f]/40 rounded-[20px] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-white/[0.02] relative group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-[#ffb95f]/30">
            <Upload className="w-5 h-5 text-[#909097] group-hover:text-[#ffb95f] transition-colors" />
          </div>
          <div className="text-center select-none">
            <p className="text-sm font-semibold text-[#d4e4fa]">Click to upload CSV</p>
            <p className="text-xs text-[#909097] mt-1">or drag and drop here</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview Header */}
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
            <FileText className="w-4 h-4 text-[#7bd0ff] flex-shrink-0" />
            <p className="text-xs text-[#d4e4fa] font-semibold flex-1 truncate">{fileName}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {validCount > 0 && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full select-none">
                  {validCount} OK
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full select-none">
                  {errorCount} Err
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setRows([])
                setStep('upload')
                setFileName('')
                if (fileRef.current) fileRef.current.value = ''
              }}
              className="p-1 rounded-full hover:bg-white/5 text-[#909097] hover:text-[#d4e4fa] transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Table */}
          <div className="border border-white/5 rounded-2xl overflow-hidden max-h-52 overflow-y-auto bg-black/20">
            <table className="w-full text-xs">
              <thead className="bg-white/5 border-b border-white/5 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-[#909097] font-semibold">Name</th>
                  <th className="text-left px-3 py-2 text-[#909097] font-semibold">DOB/Class</th>
                  <th className="text-left px-3 py-2 text-[#909097] font-semibold">Category</th>
                  <th className="text-left px-3 py-2 text-[#909097] font-semibold">Group</th>
                  <th className="text-left px-3 py-2 text-[#909097] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={row.valid ? '' : 'bg-red-500/5'}
                  >
                    <td className="px-3 py-2 text-[#d4e4fa] font-medium">{row.name || '—'}</td>
                    <td className="px-3 py-2 text-[#909097]">{row.class || '—'}</td>
                    <td className="px-3 py-2 text-[#909097]">{row.category || '—'}</td>
                    <td className="px-3 py-2 text-[#909097]">{row.group_name || '—'}</td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="text-emerald-400 font-semibold text-[10px]">✓ OK</span>
                      ) : (
                        <span className="text-red-400 font-semibold text-[10px] cursor-help" title={row.error}>⚠ Err</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold text-[#d4e4fa] transition-all"
        >
          Cancel
        </button>
        {step === 'preview' && (
          <button
            onClick={handleImport}
            disabled={loading || validCount === 0}
            className="flex-1 py-3 rounded-full action-btn-primary text-sm font-semibold flex items-center justify-center gap-2 select-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#2a1700]" /> : null}
            Import {validCount} Athletes
          </button>
        )}
      </div>
    </div>
  )
}
