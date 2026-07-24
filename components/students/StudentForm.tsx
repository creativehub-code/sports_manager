'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Camera, UserPlus } from 'lucide-react'
import type { Group, Category, Student } from '@/lib/types'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSchema, type StudentFormData } from '@/lib/validations/student'
import { saveStudentAction } from '@/app/actions/students'

const CATEGORIES: Category[] = ['Sub Junior', 'Junior', 'Senior']

interface StudentFormProps {
  student?: Student
  groups: Group[]
  onSuccess: () => void
  onCancel?: () => void
}

export function StudentForm({ student, groups, onSuccess, onCancel }: StudentFormProps) {
  const isEdit = !!student
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState(student?.photo_url || '')
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: student ? student.name.split(' ')[0] : '',
      lastName: student ? student.name.split(' ').slice(1).join(' ') : '',
      dateOfBirth: student?.class || '',
      category: student?.category || 'Junior',
      groupId: student?.group_id || '',
    },
  })

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

  async function onSubmit(data: StudentFormData) {
    const formData = new FormData()
    formData.append('firstName', data.firstName)
    formData.append('lastName', data.lastName)
    formData.append('dateOfBirth', data.dateOfBirth)
    formData.append('category', data.category)
    if (data.groupId) formData.append('groupId', data.groupId)
    if (photoFile) formData.append('photoFile', photoFile)
    if (isEdit && student) formData.append('studentId', student.id)

    try {
      const result = await saveStudentAction(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Athlete ${isEdit ? 'updated' : 'added'} successfully`)
      if (!isEdit) {
        reset()
        setPhotoFile(null)
        setPhotoPreview('')
      }
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Operation failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            {...register('firstName')}
            placeholder="Enter first name"
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
          />
          {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Last Name</label>
          <input
            type="text"
            {...register('lastName')}
            placeholder="Enter last name"
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] placeholder:text-[#909097]/50"
          />
          {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
        </div>

        {/* Sport / Discipline (Dropdown for Categories) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Sport / Discipline</label>
          <select
            {...register('category')}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
          >
            <option value="" disabled className="bg-[#0c1a2c]">Select discipline</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0c1a2c] text-[#d4e4fa]">
                {cat} Division
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category.message}</p>}
        </div>

        {/* Date of Birth / Grade (Input date, maps to class) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Date of Birth</label>
          <input
            type="date"
            {...register('dateOfBirth')}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none placeholder:text-[#909097]/50"
          />
          {errors.dateOfBirth && <p className="text-xs text-red-500 font-medium">{errors.dateOfBirth.message}</p>}
        </div>

        {/* Optional Group/House dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#909097]">Assign House / Group</label>
          <select
            {...register('groupId')}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl input-glass text-sm text-[#d4e4fa] focus:outline-none"
          >
            <option value="" className="bg-[#0c1a2c]">— No group —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} className="bg-[#0c1a2c] text-[#d4e4fa]">
                {g.name}
              </option>
            ))}
          </select>
          {errors.groupId && <p className="text-xs text-red-500 font-medium">{errors.groupId.message}</p>}
        </div>

      </div>

      {/* Button CTA */}
      <div className="pt-2 flex justify-end">
        {isEdit && onCancel ? (
          <div className="flex w-full sm:w-auto gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-sm font-semibold text-[#d4e4fa] hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl action-btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin text-[#2a1700]" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-4 rounded-xl action-btn-primary text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ffb95f]/10 hover:shadow-[#ffb95f]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin text-[#2a1700]" /> Adding Athlete...</>
            ) : (
              <><UserPlus className="w-4 h-4 text-[#2a1700]" /> Add Athlete</>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
