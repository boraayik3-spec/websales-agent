import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOutreachEmail, sendOutreachEmail, generateFollowupEmail } from '@/lib/outreach'

// Hourly cron: pick the 5 oldest pending outreach rows and fan out send events.
export const processPendingOutreach = inngest.createFunction(
  {
    id: 'process-pending-outreach',
    triggers: [{ cron: '0 * * * *' }],
  },
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    const pending = await step.run('fetch-pending', async () => {
      const { data, error } = await supabase
        .from('outreach')
        .select('id, business_id')
        .eq('stage', 'pending')
        .order('created_at', { ascending: true })
        .limit(5)
      if (error) throw new Error(`fetch failed: ${error.message}`)
      return data ?? []
    })

    if (pending.length === 0) {
      logger.info('No pending outreach rows')
      return { processed: 0 }
    }

    await step.sendEvent(
      'fan-out',
      pending.map((row) => ({
        name: 'outreach/email.send' as const,
        data: { outreach_id: row.id, business_id: row.business_id },
      }))
    )

    return { processed: pending.length, outreach_ids: pending.map((p) => p.id) }
  }
)

// Event-driven send: generates the email and sends it via Resend.
// Throttled to 10 emails per minute globally to protect sender reputation.
export const sendOutreachEmailFn = inngest.createFunction(
  {
    id: 'send-outreach-email',
    triggers: [{ event: 'outreach/email.send' }],
    throttle: {
      limit: 10,
      period: '1m',
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const outreachId = event.data.outreach_id as string
    const supabase = createAdminClient()

    const business = await step.run('fetch-business', async () => {
      const { data: outreach, error } = await supabase
        .from('outreach')
        .select('stage, businesses(name, type, website, website_status, email)')
        .eq('id', outreachId)
        .single()

      if (error || !outreach) throw new Error(`outreach not found: ${error?.message ?? 'no row'}`)
      if (outreach.stage !== 'pending') {
        throw new Error(`outreach ${outreachId} not pending (stage=${outreach.stage}) — skipping`)
      }
      const b = Array.isArray(outreach.businesses) ? outreach.businesses[0] : outreach.businesses
      if (!b) throw new Error(`outreach ${outreachId} missing business`)
      if (!b.email) throw new Error(`business has no email`)
      return b
    })

    const email = await step.run('generate-email', () =>
      generateOutreachEmail({
        name: business.name,
        type: business.type,
        website: business.website,
        website_status: business.website_status,
      })
    )

    await step.run('send-email', () => sendOutreachEmail(business.email!, email))

    await step.run('mark-sent', async () => {
      const { error } = await supabase
        .from('outreach')
        .update({
          stage: 'email_1_sent',
          email_1_sent_at: new Date().toISOString(),
        })
        .eq('id', outreachId)
      if (error) throw new Error(`update failed: ${error.message}`)
    })

    return { ok: true, outreach_id: outreachId, subject: email.subject }
  }
)

// Daily cron: pick email_1_sent rows where 3+ days have passed and fan out follow-up events.
export const processFollowupEmails = inngest.createFunction(
  {
    id: 'process-followup-emails',
    triggers: [{ cron: '0 9 * * *' }], // 9am daily
  },
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Find outreach rows where email_1_sent_at is 3+ days ago and stage is still email_1_sent
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const followups = await step.run('fetch-followups', async () => {
      const { data, error } = await supabase
        .from('outreach')
        .select('id, business_id')
        .eq('stage', 'email_1_sent')
        .lt('email_1_sent_at', threeDaysAgo.toISOString())
        .order('email_1_sent_at', { ascending: true })
        .limit(5)
      if (error) throw new Error(`fetch failed: ${error.message}`)
      return data ?? []
    })

    if (followups.length === 0) {
      logger.info('No follow-up emails to send')
      return { processed: 0 }
    }

    await step.sendEvent(
      'fan-out-followups',
      followups.map((row) => ({
        name: 'outreach/followup.send' as const,
        data: { outreach_id: row.id, business_id: row.business_id },
      }))
    )

    return { processed: followups.length, outreach_ids: followups.map((p) => p.id) }
  }
)

// Event-driven follow-up send: generates the follow-up email and sends it via Resend.
// Throttled to 10 emails per minute to protect sender reputation.
export const sendFollowupEmailFn = inngest.createFunction(
  {
    id: 'send-followup-email',
    triggers: [{ event: 'outreach/followup.send' }],
    throttle: {
      limit: 10,
      period: '1m',
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const outreachId = event.data.outreach_id as string
    const supabase = createAdminClient()

    const business = await step.run('fetch-business', async () => {
      const { data: outreach, error } = await supabase
        .from('outreach')
        .select('stage, businesses(name, type, website, website_status, email)')
        .eq('id', outreachId)
        .single()

      if (error || !outreach) throw new Error(`outreach not found: ${error?.message ?? 'no row'}`)
      if (outreach.stage !== 'email_1_sent') {
        throw new Error(`outreach ${outreachId} not at email_1_sent stage (stage=${outreach.stage}) — skipping`)
      }
      const b = Array.isArray(outreach.businesses) ? outreach.businesses[0] : outreach.businesses
      if (!b) throw new Error(`outreach ${outreachId} missing business`)
      if (!b.email) throw new Error(`business has no email`)
      return b
    })

    const email = await step.run('generate-followup', () =>
      generateFollowupEmail({
        name: business.name,
        type: business.type,
        website: business.website,
        website_status: business.website_status,
      })
    )

    await step.run('send-followup', () => sendOutreachEmail(business.email!, email))

    await step.run('mark-followup-sent', async () => {
      const { error } = await supabase
        .from('outreach')
        .update({
          stage: 'email_2_sent',
          email_2_sent_at: new Date().toISOString(),
        })
        .eq('id', outreachId)
      if (error) throw new Error(`update failed: ${error.message}`)
    })

    return { ok: true, outreach_id: outreachId, subject: email.subject }
  }
)
