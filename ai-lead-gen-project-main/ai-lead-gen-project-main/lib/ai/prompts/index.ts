import { AIMessageType, MessageTone } from '@/lib/enums'

export function getPrompt(messageType: AIMessageType, tone: MessageTone): string {
  const basePrompt = `You are an expert sales consultant helping to write highly personalized outreach messages. Your messages are professional, specific, and genuinely valuable to the recipient. You always personalize based on the lead's company, role, and pain points.`

  const toneGuide = getToneGuide(tone)
  const typeGuide = getTypeGuide(messageType)

  return `${basePrompt}\n\n${toneGuide}\n\n${typeGuide}`
}

function getToneGuide(tone: MessageTone): string {
  switch (tone) {
    case 'PROFESSIONAL':
      return `Tone: Use formal, professional language. Focus on mutual benefit and credentials. Avoid excessive enthusiasm.`
    case 'FRIENDLY':
      return `Tone: Be warm and approachable. Use conversational language. Show genuine interest in their success.`
    case 'CONSULTATIVE':
      return `Tone: Position yourself as an advisor. Ask thoughtful questions. Focus on understanding their challenges first.`
    case 'DIRECT':
      return `Tone: Be concise and to the point. Lead with the value proposition. No fluff, all substance.`
    case 'EXECUTIVE':
      return `Tone: Assume the recipient is busy and important. Use metrics and ROI. Respect their time with brevity.`
    default:
      return `Tone: Be professional and personalized.`
  }
}

function getTypeGuide(messageType: AIMessageType): string {
  switch (messageType) {
    case 'CONNECTION_MESSAGE':
      return `Message Type: LinkedIn Connection Request Message
      - Keep it brief (2-3 sentences max)
      - Mention how you found them or mutual connections
      - Give one specific reason why connecting would be valuable
      - End with a soft call to action`

    case 'FOLLOWUP_MESSAGE':
      return `Message Type: Follow-up Message
      - Reference your previous interaction specifically
      - Add new information or perspective
      - Show you've been thinking about their needs
      - Make it easy to say yes to next steps`

    case 'SALES_PITCH':
      return `Message Type: Sales Pitch
      - Lead with the customer's problem
      - Show how your solution solves it specifically
      - Include a relevant metric or case study
      - End with a specific next step (demo, call, etc.)`

    case 'COLD_OUTREACH':
      return `Message Type: Cold Outreach Message
      - Show you've done your research on them/their company
      - Lead with a problem they likely face
      - Briefly position your solution
      - Make it extremely easy to respond (yes/no question)`

    case 'CALL_INVITATION':
      return `Message Type: Call Invitation
      - Make it about them, not you
      - Specify the time investment (15/20/30 min)
      - Give them options for timing
      - End with a specific, easy call to action`

    case 'REENGAGEMENT':
      return `Message Type: Re-engagement Message
      - Acknowledge the time gap
      - Show what's changed (new feature, new insights, etc.)
      - Reference your past interaction positively
      - Give them a specific reason to re-engage`

    default:
      return `Write a professional, personalized message.`
  }
}

export const messageTypes = [
  'CONNECTION_MESSAGE',
  'FOLLOWUP_MESSAGE',
  'SALES_PITCH',
  'COLD_OUTREACH',
  'CALL_INVITATION',
  'REENGAGEMENT',
] as const

export const tones = [
  'PROFESSIONAL',
  'FRIENDLY',
  'CONSULTATIVE',
  'DIRECT',
  'EXECUTIVE',
] as const

export const lengths = ['SHORT', 'MEDIUM', 'LONG'] as const
