import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const migration = `
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS website_repo_url TEXT,
ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'pending' CHECK (website_status IN ('pending', 'generating', 'deploying', 'deployed', 'failed')),
ADD COLUMN IF NOT EXISTS website_generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_businesses_website_status ON businesses(website_status);
CREATE INDEX IF NOT EXISTS idx_businesses_website_generated_at ON businesses(website_generated_at);
`.trim()

async function runMigration() {
  try {
    // Split by semicolon to execute each statement separately
    const statements = migration.split(';').filter((s) => s.trim())

    for (const statement of statements) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement.trim(),
      })

      if (error) {
        console.error(`Error executing statement: ${statement}`)
        console.error(error)
        process.exit(1)
      }

      console.log(`✓ Executed: ${statement.substring(0, 50)}...`)
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

runMigration()
