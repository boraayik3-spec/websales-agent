import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'websales-agent',
})

export type AppEvents = {
  'outreach/email.send': {
    data: {
      outreach_id: string
      business_id: string
    }
  }
}
