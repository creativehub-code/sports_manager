import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specials = '!@#$%^&*'
  
  const all = uppercase + lowercase + numbers + specials
  
  const password = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    specials[crypto.randomInt(0, specials.length)],
  ]
  
  for (let i = 4; i < length; i++) {
    password.push(all[crypto.randomInt(0, all.length)])
  }
  
  // Secure Fisher-Yates shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[password[i], password[j]] = [password[j], password[i]]
  }
  
  return password.join('')
}

export async function POST(request: NextRequest) {
  try {
    const authClient = createClient()
    const { data: { user: currentUser } } = await authClient.auth.getUser()

    if (!currentUser || currentUser.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, schoolId } = await request.json()
    if (!email || !schoolId) {
      return NextResponse.json({ error: 'Email and School ID are required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const tempPassword = generateSecurePassword(12)

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        school_id: schoolId,
        role: 'school_admin',
        force_password_reset: true
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, tempPassword })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
