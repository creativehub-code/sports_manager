'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera, UserPlus } from 'lucide-react'
import type { Group, Category, Student } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'
import Image from 'next/image'

const CATEGORIES: Category[] = ['Sub Junior', 'Junior', 'Senior']

interface StudentFormProps {
  student?: Student
  groups: Group[]
  onSuccess: () => void
  onCancel?: () => void
}

export function StudentForm({ student, groups, onSuccess, onCancel }: StudentFormProps) {
  const isEdit = !!student
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const { schoolId, user } = useAuth()

  const [firstName, setFirstName] = useState(() => {
    if (!student) return ''
    const parts = student.name.trim().split(' ')
    return parts[0] || ''
  })
  const [lastName, setLastName] = useState(() => {
    if (!student) return ''
    const parts = student.name.trim().split(' ')
    return parts.slice(1).join(' ') || ''
  })
  const [dateOfBirth, setDateOfBirth] = useState(student?.class || '') // Maps to "class" text column
  const [category, setCategory] = useState<Category>(student?.category || 'Junior') // Maps to "Sport / Discipline"
  const [groupId, setGroupId] = useState(student?.group_id || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState(student?.photo_url || '')
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5 MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(studentId: string): Promise<string | null> {
    if (!photoFile) return student?.photo_url || null
    const ext = photoFile.name.split('.').pop()
    const path = `${studentId}.${ext}`
    const { error } = await supabase.storage
      .from('student-photos')
      .upload(path, photoFile, { upsert: true })
    if (error) {
      toast.error('Photo upload failed: ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('student-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!fullName || !dateOfBirth.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)

    try {
      if (isEdit) {
        const photoUrl = await uploadPhoto(student.id)
        const { error } = await (supabase
          .from('students') as any)
          .update({
            name: fullName,
            class: dateOfBirth.trim(),
            category,
            group_id: groupId || null,
            photo_url: photoUrl,
          } as any)
          .eq('id', student.id)
        if (error) throw error
        toast.success('Athlete updated successfully')
      } else {
        const currentSchoolId = schoolId || user?.user_metadata?.school_id
        if (!currentSchoolId) throw new Error('No school context selected')
        const { data: inserted, error: insertError } = await (supabase
          .from('students') as any)
          .insert({
            name: fullName,
            class: dateOfBirth.trim(),
            category,
            group_id: groupId || null,
            photo_url: null,
            school_id: currentSchoolId,
          } as any)
          .select()
          .single()
        if (insertError) throw insertError
        if (insertError) throw insertError

        const photoUrl = await uploadPhoto((inserted as any).id)
        if (photoUrl) {
          await (supabase
            .from('students') as any)
            .update({ photo_url: photoUrl })
            .eq('id', (inserted as any).id)
        }
        toast.success('Athlete added successfully')

        // Reset form fields
        setFirstName('')
        setLastName('')
        setDateOfBirth('')
        setCategory('Junior')
        setGroupId('')
        setPhotoFile(null)
        setPhotoPreview('')
      }
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Profile Photo Uploader */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div
          className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all duration-200 hover:border-[#ffb95f]/30"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Profile Photo"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized={photoPreview.startsWith('blob:')}
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Camera className="w-8 h-8 text-[#909097] group-hover:text-[#ffb95f] transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <span className="text-xs font-semibold text-[#909097] select-none">Profile Photo</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Inputs Section */}
      <div className="space-y-4">

        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            required
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
          />
        </div>

        {/* Sport / Discipline (Dropdown for Categories) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Sport / Discipline</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
          >
            <option value="" disabled className="bg-[#0c1a2c]">Select discipline</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0c1a2c] text-[#d4e4fa]">
                {cat} Division
              </option>
            ))}
          </select>
        </div>

        {/* Date of Birth / Grade (Input date, maps to class) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none placeholder:text-[#909097]/50"
          />
        </div>

        {/* Optional Group/House dropdown for Edit Mode */}
        {isEdit && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Assign House / Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
            >
              <option value="" className="bg-[#0c1a2c]">— No group —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#0c1a2c] text-[#d4e4fa]">
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Button CTA */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold text-[#d4e4fa] transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !firstName.trim() || !dateOfBirth.trim()}
          className="flex-1 py-3 rounded-full action-btn-primary text-sm flex items-center justify-center gap-2 select-none"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2a1700]" />
          ) : (
            <UserPlus className="w-4 h-4 text-[#2a1700]" />
          )}
          {isEdit ? 'Save Athlete Details' : 'Add Athlete'}
        </button>
      </div>
    </form>
  )
}
