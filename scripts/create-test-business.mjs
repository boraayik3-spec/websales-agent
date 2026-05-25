import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function createTestBusiness() {
  // Insert business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      name: 'Karakol Nargile Lounge',
      type: 'salon',
      email: 'info@karakol-nargile.com',
      website: null,
      website_status: null,
    })
    .select()
    .single()

  if (bizError) {
    console.error('Business insert error:', bizError)
    process.exit(1)
  }

  console.log('✓ Business created:', business.id, business.name)

  // Insert outreach record
  const { data: outreach, error: outreachError } = await supabase
    .from('outreach')
    .insert({
      business_id: business.id,
      stage: 'email_1_sent',
      email_1_sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (outreachError) {
    console.error('Outreach insert error:', outreachError)
    process.exit(1)
  }

  console.log('✓ Outreach created:', outreach.id)
  console.log('\n✅ Test Business Ready!')
  console.log('Name: Karakol Nargile Lounge')
  console.log('Email: info@karakol-nargile.com')
  console.log('Business ID: ' + business.id)
}

createTestBusiness()
