import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyReply } from '@/lib/reply-classifier'

export const runtime = 'nodejs'

interface NylasMessage {
  id: string
  grant_id?: string
  subject?: string
  from?: { email: string; name?: string }[]
  body?: string
  snippet?: string
}

interface NylasEvent {
  type: string
  data: {
    object: NylasMessage
  }
}

// Nylas webhook URL verification (sent during webhook creation)
export async function GET(request: NextRequest) {
  const challenge = new URL(request.url).searchParams.get('challenge')
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new NextResponse('OK')
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-nylas-signature')
  const secret = process.env.NYLAS_WEBHOOK_SECRET

  if (!secret) {
    console.error('NYLAS_WEBHOOK_SECRET not set')
    return new NextResponse('Server not configured', { status: 500 })
  }
  if (!signature) {
    return new NextResponse('Missing signature', { status: 401 })
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const sigBuf = Buffer.from(signature, 'hex')
  const expBuf = Buffer.from(expected, 'hex')
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let event: NylasEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  if (event.type !== 'message.created') {
    return new NextResponse('Ignored')
  }

  const message = event.data?.object
  const fromEmail = message?.from?.[0]?.email?.toLowerCase()
  if (!fromEmail) {
    return new NextResponse('No sender')
  }

  const supabase = createAdminClient()

  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, outreach(id, stage, reply_at, email_1_sent_at)')
    .ilike('email', fromEmail)
    .maybeSingle()

  if (bizErr) {
    console.error('Business lookup failed:', bizErr)
    return new NextResponse('Lookup failed', { status: 500 })
  }
  if (!business || !Array.isArray(business.outreach) || business.outreach.length === 0) {
    return new NextResponse('No matching outreach')
  }

  const unreplied = business.outreach
    .filter((o) => !o.reply_at)
    .sort((a, b) => (b.email_1_sent_at ?? '').localeCompare(a.email_1_sent_at ?? ''))[0]

  if (!unreplied) {
    return new NextResponse('Already replied')
  }

  const replyText = message.body || message.snippet || message.subject || ''
  let classification
  try {
    classification = await classifyReply(replyText)
  } catch (err) {
    console.error('Classification failed:', err)
    // Record the reply even if classification fails, so it doesn't get re-processed
    await supabase
      .from('outreach')
      .update({ reply_at: new Date().toISOString(), stage: 'replied' })
      .eq('id', unreplied.id)
    return new NextResponse('Reply recorded; classification failed')
  }

  const { error: updateErr } = await supabase
    .from('outreach')
    .update({
      reply_at: new Date().toISOString(),
      reply_sentiment: classification.sentiment,
      is_interested: classification.is_interested,
      stage: classification.is_interested ? 'interested' : 'replied',
    })
    .eq('id', unreplied.id)

  if (updateErr) {
    console.error('Outreach update failed:', updateErr)
    return new NextResponse('Update failed', { status: 500 })
  }

  return new NextResponse('OK')
}
