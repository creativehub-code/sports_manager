import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  // 'code' ന് പകരം 'token_hash', 'type' എന്നിവ എടുക്കുന്നു
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = createClient()
    // പുതിയ verifyOtp രീതി
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Verify OTP error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20invitation%20link.`)
    }
  }

  // token_hash ഇല്ലാത്ത അവസ്ഥയിൽ
  return NextResponse.redirect(`${origin}/login?error=No%20invitation%20code%20provided.`)
}