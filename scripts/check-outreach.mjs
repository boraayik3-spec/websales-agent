import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const businessId = '08bf3d8d-ed6b-4eb2-8111-d1f2159c22fa'

// Check outreach records
const { data: outreach, error } = await supabase
  .from('outreach')
  .select('*')
  .eq('business_id', businessId)
  .single()

if (error) {
  console.log('Error:', error.message)
} else {
  console.log('📋 Outreach Record:')
  console.log('ID:', outreach.id)
  console.log('Business ID:', outreach.business_id)
  console.log('Stage:', outreach.stage)
  console.log('Reply At:', outreach.reply_at)
  console.log('')
  console.log('✅ Classification recorded at:', outreach.reply_at)
  console.log('')
  console.log('Current stage:', outreach.stage)
  if (outreach.stage === 'portfolio_sent') {
    console.log('✓ Portfolio email sent')
    console.log('✓ Website generation event triggered')
  }
}
