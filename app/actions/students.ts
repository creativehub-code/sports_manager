'use server'

import { createClient } from '@/lib/supabase/server'
import { studentSchema } from '@/lib/validations/student'

export async function saveStudentAction(formData: FormData) {
  try {
    const supabase = createClient()
    
    // Auth context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }
    
    const schoolId = user.user_metadata?.school_id
    if (!schoolId) {
      return { error: 'No school context found' }
    }

    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      dateOfBirth: formData.get('dateOfBirth'),
      category: formData.get('category'),
      groupId: formData.get('groupId') || undefined,
    }

    // 1. Zod Validation
    const validatedData = studentSchema.parse(rawData)
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`
    
    const studentId = formData.get('studentId') as string | null
    const isEdit = !!studentId

    // Handle photo file if present
    const photoFile = formData.get('photoFile') as File | null
    let photoUrl: string | null = null
    
    let targetStudentId = studentId

    if (isEdit) {
      // UPDATE
      if (photoFile && photoFile.size > 0) {
        photoUrl = await uploadPhoto(supabase, targetStudentId!, photoFile)
      }

      const updateData: any = {
        name: fullName,
        class: validatedData.dateOfBirth,
        category: validatedData.category,
        group_id: validatedData.groupId || null,
      }
      if (photoUrl) {
        updateData.photo_url = photoUrl
      }

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', targetStudentId)
      
      if (error) throw error

    } else {
      // INSERT
      const { data: inserted, error: insertError } = await supabase
        .from('students')
        .insert({
          name: fullName,
          class: validatedData.dateOfBirth,
          category: validatedData.category,
          group_id: validatedData.groupId || null,
          photo_url: null,
          school_id: schoolId,
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      targetStudentId = inserted.id

      if (photoFile && photoFile.size > 0) {
        photoUrl = await uploadPhoto(supabase, targetStudentId!, photoFile)
        if (photoUrl) {
          await supabase
            .from('students')
            .update({ photo_url: photoUrl })
            .eq('id', targetStudentId)
        }
      }
    }

    return { success: true }
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: 'Validation failed. Please check your inputs.' }
    }
    return { error: error.message || 'Operation failed' }
  }
}

async function uploadPhoto(supabase: any, studentId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${studentId}.${ext}`
  
  const { error } = await supabase.storage
    .from('student-photos')
    .upload(path, file, { upsert: true })
    
  if (error) {
    console.error('Photo upload error:', error)
    return null
  }
  
  const { data } = supabase.storage.from('student-photos').getPublicUrl(path)
  return data.publicUrl
}
