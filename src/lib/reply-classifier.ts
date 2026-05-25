import { anthropic, MODELS } from './anthropic'

export type Classification = 'interested' | 'not_interested' | 'maybe'

export interface ReplyClassification {
  classification: Classification
  summary: string
}

const SYSTEM_PROMPT = `You analyze replies to cold outreach emails offering web design / website-build services to local businesses.
Classify the sender's interest level into three categories:
- interested: They want to learn more, see a draft, schedule a call, or move forward
- not_interested: They explicitly decline, unsubscribe, or are clearly not interested
- maybe: They're uncertain, need more info, or haven't clearly committed either way`

const CLASSIFY_TOOL = {
  name: 'classify_reply',
  description: 'Submit the classification of the email reply.',
  input_schema: {
    type: 'object' as const,
    properties: {
      classification: {
        type: 'string',
        enum: ['interested', 'not_interested', 'maybe'],
        description: 'Classification of the sender\'s interest level.',
      },
      summary: {
        type: 'string',
        description: 'One-sentence summary of the reply.',
      },
    },
    required: ['classification', 'summary'],
  },
}

export async function classifyReply(replyText: string): Promise<ReplyClassification> {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'tool', name: CLASSIFY_TOOL.name },
    messages: [{ role: 'user', content: `Reply text:\n\n${replyText}` }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Classifier did not return a tool_use block')
  }
  return toolUse.input as ReplyClassification
}
