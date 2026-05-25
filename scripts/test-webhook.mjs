import crypto from 'node:crypto'

const secret = process.env.NYLAS_WEBHOOK_SECRET
const baseUrl = 'https://websales-agent.vercel.app'

// Mock Nylas message event
const event = {
  type: 'message.created',
  data: {
    object: {
      id: 'msg-123',
      from: [{ email: 'info@karakol-nargile.com', name: 'Karakol Nargile' }],
      subject: 'Re: Website Offer',
      body: 'Evet, web sitemiz için yazılım yapmanız harika olur. Detaylı bilgi alabilir miyim?',
    },
  },
}

const rawBody = JSON.stringify(event)
const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

console.log('📤 Sending webhook test...')
console.log('Business Email: info@karakol-nargile.com')
console.log('Message: "Evet, web sitemiz için yazılım yapmanız harika olur."')

const response = await fetch(\\/api/webhooks/nylas\, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nylas-signature': signature,
  },
  body: rawBody,
})

const responseText = await response.text()
console.log('\n✓ Response Status:', response.status)
console.log('✓ Response:', responseText)

if (response.status === 200) {
  console.log('\n✅ Webhook triggered successfully!')
  console.log('🚀 Website generation started in background...')
}
