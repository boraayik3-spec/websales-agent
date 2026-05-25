import { anthropic, MODELS } from './anthropic'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export interface BusinessInput {
  name: string
  type: string | null
  website: string | null
  website_status: string | null
}

export interface GeneratedEmail {
  subject: string
  body: string
}

const SYSTEM_PROMPT = `You write short, friendly cold outreach emails on behalf of a web design service.

Tone: warm, specific, and human. No buzzwords, no "I hope this email finds you well", no hype.
Length: 3-5 sentences. Single paragraph or two short ones.
Goal: offer to build them a modern website in a few days, and ask if they'd like to see a free draft.`

const EMAIL_TOOL = {
  name: 'draft_outreach_email',
  description: 'Submit the drafted cold outreach email.',
  input_schema: {
    type: 'object' as const,
    properties: {
      subject: { type: 'string', description: 'Email subject line. Short and specific.' },
      body: { type: 'string', description: 'Email body text. 3-5 sentences.' },
    },
    required: ['subject', 'body'],
  },
}

const FOLLOWUP_SYSTEM_PROMPT = `You write short, friendly follow-up emails on behalf of a web design service. This is the second email, not the first.

Tone: warm, casual, and human. Don't over-explain or be pushy.
Length: 2-4 sentences. Keep it brief.
Goal: remind them about the offer from a different angle (maybe focus on speed, portfolio examples, or social proof instead of features). End with a simple call-to-action.
Avoid: repeating the exact same message. Take a different approach.`

const FOLLOWUP_EMAIL_TOOL = {
  name: 'draft_followup_email',
  description: 'Submit the drafted follow-up email.',
  input_schema: {
    type: 'object' as const,
    properties: {
      subject: { type: 'string', description: 'Email subject line. Short and friendly.' },
      body: { type: 'string', description: 'Email body text. 2-4 sentences.' },
    },
    required: ['subject', 'body'],
  },
}

const PORTFOLIO_SYSTEM_PROMPT = `You write warm and professional portfolio presentation emails for a web design service (siterise.space).
The client is interested and you're presenting pricing and packages.

Tone: warm, professional, confidence-building. Show expertise and value.
Length: 3-5 sentences intro + package descriptions.
Goal: present three packages clearly, show the difference in value, and encourage them to choose or ask questions.
Include: brief siterise.space intro, showcase the three tiers, end with friendly call-to-action.`

const PORTFOLIO_EMAIL_TOOL = {
  name: 'draft_portfolio_email',
  description: 'Submit the drafted portfolio email with package details.',
  input_schema: {
    type: 'object' as const,
    properties: {
      subject: { type: 'string', description: 'Email subject line. Professional and engaging.' },
      body: { type: 'string', description: 'Email body with intro, packages, and CTA.' },
    },
    required: ['subject', 'body'],
  },
}

export async function generateOutreachEmail(business: BusinessInput): Promise<GeneratedEmail> {
  const userPrompt = `Business: ${business.name}
Type: ${business.type ?? 'unknown'}
Current website: ${business.website ?? 'none'}
Website status: ${business.website_status ?? 'unknown'}

Draft the cold outreach email by calling draft_outreach_email.`

  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    tools: [EMAIL_TOOL],
    tool_choice: { type: 'tool', name: EMAIL_TOOL.name },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  const input = toolUse.input as Partial<GeneratedEmail>
  if (!input.subject || !input.body) {
    throw new Error('Generated email missing subject or body')
  }
  return { subject: input.subject, body: input.body }
}

export async function generateFollowupEmail(business: BusinessInput): Promise<GeneratedEmail> {
  const userPrompt = `Business: ${business.name}
Type: ${business.type ?? 'unknown'}
Current website: ${business.website ?? 'none'}
Website status: ${business.website_status ?? 'unknown'}

Draft a follow-up email (this is the second email) by calling draft_followup_email. Make it different from the first email.`

  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 500,
    system: FOLLOWUP_SYSTEM_PROMPT,
    tools: [FOLLOWUP_EMAIL_TOOL],
    tool_choice: { type: 'tool', name: FOLLOWUP_EMAIL_TOOL.name },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  const input = toolUse.input as Partial<GeneratedEmail>
  if (!input.subject || !input.body) {
    throw new Error('Generated follow-up email missing subject or body')
  }
  return { subject: input.subject, body: input.body }
}

export async function generatePortfolioEmail(business: BusinessInput): Promise<GeneratedEmail> {
  const userPrompt = `Business: ${business.name}
Type: ${business.type ?? 'unknown'}
Current website: ${business.website ?? 'none'}
Website status: ${business.website_status ?? 'unknown'}

Draft a portfolio presentation email with our three packages by calling draft_portfolio_email.

Our packages:
1. Starter - 5000 TL: 5 pages, mobile responsive, contact form
2. Business - 6000 TL: 8 pages, animations, Google Maps integration, gallery
3. Premium - 7500 TL: 10 pages, custom design, SEO optimization, 1 month support

Make it personalized for ${business.name} and show enthusiasm for their business.`

  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 800,
    system: PORTFOLIO_SYSTEM_PROMPT,
    tools: [PORTFOLIO_EMAIL_TOOL],
    tool_choice: { type: 'tool', name: PORTFOLIO_EMAIL_TOOL.name },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  const input = toolUse.input as Partial<GeneratedEmail>
  if (!input.subject || !input.body) {
    throw new Error('Generated portfolio email missing subject or body')
  }
  return { subject: input.subject, body: input.body }
}

export async function sendOutreachEmail(to: string, email: GeneratedEmail) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: email.subject,
    text: email.body,
  })

  if (error) {
    throw new Error(`Resend: ${error.message}`)
  }
  return data
}
