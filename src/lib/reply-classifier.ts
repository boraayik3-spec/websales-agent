import { anthropic, MODELS } from './anthropic'

export type Sentiment = 'positive' | 'negative' | 'neutral'

export interface ReplyClassification {
  sentiment: Sentiment
  is_interested: boolean
  summary: string
}

const SYSTEM_PROMPT = `You analyze replies to cold outreach emails offering web design / website-build services to local businesses.
Classify the sentiment and whether the sender wants to move forward (see a draft, schedule a call, learn more).`

const CLASSIFY_TOOL = {
  name: 'classify_reply',
  description: 'Submit the classification of the email reply.',
  input_schema: {
    type: 'object' as const,
    properties: {
      sentiment: {
        type: 'string',
        enum: ['positive', 'negative', 'neutral'],
        description: 'Overall tone of the reply.',
      },
      is_interested: {
        type: 'boolean',
        description: 'True if the sender wants to see a draft, hop on a call, or otherwise move forward. False if they decline, unsubscribe, or are clearly uninterested.',
      },
      summary: {
        type: 'string',
        description: 'One-sentence summary of the reply.',
      },
    },
    required: ['sentiment', 'is_interested', 'summary'],
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
