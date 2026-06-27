import { AIMessageType, MessageTone, MessageLength } from '@/lib/enums'

export interface AIProviderResponse {
  success: boolean
  message?: string
  error?: string
  tokensUsed: number
}

export interface GenerateMessageInput {
  leadName: string
  company?: string
  role?: string
  industry?: string
  painPoints?: string
  productName: string
  valueProposition: string
  messageType: AIMessageType
  tone: MessageTone
  length: MessageLength
  pastNotes?: string
}

export interface AIProvider {
  name: string
  isAvailable(): boolean
  generateMessage(input: GenerateMessageInput): Promise<AIProviderResponse>
  estimateTokens(input: GenerateMessageInput): number
}
