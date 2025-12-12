import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')

  // Default redirect is now /events instead of /
  const next = _next?.startsWith('/') ? _next : '/events'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect to /events (or the provided next param)
      redirect(next)
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error?.message)}`)
    }
  }

  // If token or type missing → error page
  redirect(`/auth/error?error=No token hash or type`)
}
