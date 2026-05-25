import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    })
)

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)

const tables = ['businesses', 'outreach', 'websites', 'users']
for (const t of tables) {
  const { error, count } = await supabase
    .from(t)
    .select('*', { count: 'exact', head: true })
  if (error) {
    console.log(`${t}: FAIL — ${error.message} (code ${error.code})`)
  } else {
    console.log(`${t}: OK (rows: ${count})`)
  }
}
