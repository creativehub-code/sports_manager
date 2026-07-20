import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

// Service-role client for API routes (bypasses RLS, server-only)
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
