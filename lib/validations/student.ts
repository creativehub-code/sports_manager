import { z } from 'zod'

export const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  dateOfBirth: z.string().min(1, 'Date of birth is required').trim(),
  category: z.enum(['Sub Junior', 'Junior', 'Senior'] as const, { message: 'Category is required' }),
  groupId: z.string().optional(),
})

export type StudentFormData = z.infer<typeof studentSchema>
