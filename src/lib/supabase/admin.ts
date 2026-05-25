import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Service-role client for server-only contexts (webhooks, cron, background jobs)
// where there is no user session. Bypasses RLS — never expose to the browser.
export function createAdminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
