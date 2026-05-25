const crypto = require('crypto')

async function testNylasWebhook() {
  const secret = process.env.NYLAS_WEBHOOK_SECRET

  if (!secret) {
    console.error('ERROR: NYLAS_WEBHOOK_SECRET env variable not set!')
    process.exit(1)
  }

  console.log('OK: NYLAS_WEBHOOK_SECRET found')
  console.log('')

  const payload = {
    type: 'message.created',
    data: {
      object: {
        id: 'msg-test-123',
        from: [{ email: 'test@example.com', name: 'Test Business' }],
        subject: 'Re: Your web design offer',
        body: 'Yes, we are very interested! This looks great. Can we schedule a call?'
      }
    }
  }

  const rawBody = JSON.stringify(payload)

  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  console.log('TEST PAYLOAD:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('')
  console.log('Signature: ' + signature.substring(0, 20) + '...')
  console.log('')

  const webhookUrl = process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL + '/api/webhooks/nylas'
    : 'http://localhost:3000/api/webhooks/nylas'

  console.log('Webhook URL: ' + webhookUrl)
  console.log('')
  console.log('Sending POST request...')
  console.log('')

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nylas-signature': signature
      },
      body: rawBody
    })

    const responseText = await response.text()

    console.log('Status Code: ' + response.status)
    console.log('Response: ' + responseText)
    console.log('')

    if (response.status === 200) {
      console.log('SUCCESS: Webhook processed!')
      console.log('')
      console.log('Check database:')
      console.log('SELECT * FROM outreach WHERE reply_at IS NOT NULL LIMIT 1;')
    } else if (response.status === 401) {
      console.log('ERROR: Signature mismatch!')
      console.log('Check: Is NYLAS_WEBHOOK_SECRET correct?')
    } else if (response.status === 500) {
      console.log('ERROR: Server error')
      console.log('Check logs: vercel logs --prod')
    } else {
      console.log('WARNING: Webhook responded but logic may not have worked')
      console.log('Reason may be in response above')
    }
  } catch (error) {
    console.error('ERROR: Fetch failed: ' + error.message)
    console.log('')
    console.log('Check:')
    console.log('1. Is localhost:3000 running? (npm run dev)')
    console.log('2. Is VERCEL_URL env var set? (for production)')
  }
}

testNylasWebhook()
