import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function testRealBusiness() {
  console.log('🚀 Creating real business test: Başkent Lounge Nargile\n')

  // 1. Create business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      name: 'Başkent Lounge Nargile',
      type: 'salon',
      email: 'contact@baskentnargile.com',
      website: null,
      website_status: null,
    })
    .select()
    .single()

  if (bizError) {
    console.error('❌ Business insert error:', bizError.message)
    process.exit(1)
  }

  console.log('✅ Business created:')
  console.log('   Name: ' + business.name)
  console.log('   Email: ' + business.email)
  console.log('   ID: ' + business.id)
  console.log('')

  // 2. Create outreach record
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
    console.error('❌ Outreach insert error:', outreachError.message)
    process.exit(1)
  }

  console.log('✅ Outreach record created')
  console.log('   ID: ' + outreach.id)
  console.log('   Stage: ' + outreach.stage)
  console.log('')

  // 3. Send webhook with interested reply
  console.log('📤 Sending interested reply webhook...')

  const event = {
    type: 'message.created',
    data: {
      object: {
        id: 'msg-' + Date.now(),
        from: [{ email: business.email, name: business.name }],
        subject: 'Re: Website Offer',
        body: 'Evet, bizi çok ilgilendiriyor! Web sitemiz için modern bir tasarıma ihtiyaç var. Hemen başlayabilir miyiz?',
      },
    },
  }

  const rawBody = JSON.stringify(event)
  const signature = crypto
    .createHmac('sha256', process.env.NYLAS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  const webhookResponse = await fetch('https://websales-agent.vercel.app/api/webhooks/nylas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-nylas-signature': signature,
    },
    body: rawBody,
  })

  const webhookStatus = webhookResponse.status
  const webhookText = await webhookResponse.text()

  console.log('✅ Webhook sent')
  console.log('   Status: ' + webhookStatus)
  console.log('   Response: ' + webhookText)
  console.log('')

  if (webhookStatus === 200) {
    console.log('🎯 SUCCESS - Website generation event triggered!')
    console.log('')
    console.log('⏳ System is now:')
    console.log('   1. Generating Next.js website with Claude Sonnet')
    console.log('   2. Pushing to GitHub as: baskentnargile-website')
    console.log('   3. Deploying to Vercel: baskentnargile.siterise.space')
    console.log('')
    console.log('📊 Check status in ~2 minutes!')
  } else {
    console.log('⚠️ Webhook returned status: ' + webhookStatus)
  }
}

testRealBusiness()
