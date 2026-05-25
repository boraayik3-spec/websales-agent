const crypto = require('crypto')

async function testNylasWebhook() {
  const secret = process.env.NYLAS_WEBHOOK_SECRET

  if (!secret) {
    console.error('ERROR: NYLAS_WEBHOOK_SECRET not set!')
    process.exit(1)
  }

  // Realistic business email
  const businessEmail = 'contact@acmecorp.com'
  const businessName = 'Acme Corporation'

  const payload = {
    type: 'message.created',
    data: {
      object: {
        id: 'msg-acme-reply-' + Date.now(),
        from: [{ email: businessEmail, name: businessName }],
        subject: 'Re: Your web design offer',
        body: 'Hello! This sounds interesting. Yes, I would love to see a draft of what you can do for our website. We are planning to redesign it this quarter.'
      }
    }
  }

  const rawBody = JSON.stringify(payload)

  // Calculate signature with the actual secret
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  console.log('TEST PAYLOAD:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('')
  console.log('Secret: ' + secret.substring(0, 10) + '...')
  console.log('Signature: ' + signature.substring(0, 30) + '...')
  console.log('')

  const webhookUrl = process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL + '/api/webhooks/nylas'
    : 'http://localhost:3000/api/webhooks/nylas'

  console.log('Webhook URL: ' + webhookUrl)
  console.log('')
  console.log('Sending POST with signature validation...')
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
      console.log('✅ SUCCESS: Webhook processed!')
      console.log('')
      console.log('Webhook is working correctly:')
      console.log('1. Signature validation passed')
      console.log('2. Message processed')
      console.log('3. Reply detection is ready!')
    } else if (response.status === 401) {
      console.log('❌ ERROR: Signature validation failed!')
      console.log('   - Check NYLAS_WEBHOOK_SECRET value')
      console.log('   - Verify signature calculation')
    } else if (response.status === 500) {
      console.log('❌ ERROR: Server error')
      console.log('   Check logs: vercel logs --prod')
    }
  } catch (error) {
    console.error('❌ ERROR: Fetch failed: ' + error.message)
  }
}

testNylasWebhook()
