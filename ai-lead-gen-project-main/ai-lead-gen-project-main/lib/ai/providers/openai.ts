import { AIProvider, GenerateMessageInput, AIProviderResponse } from './interface'
import { getPrompt } from '../prompts'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4'

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  private apiKey = process.env.OPENAI_API_KEY

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'sk-placeholder'
  }

  async generateMessage(input: GenerateMessageInput): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
        tokensUsed: 0,
      }
    }

    try {
      const systemPrompt = getPrompt(input.messageType, input.tone)
      const userPrompt = this.buildUserPrompt(input)

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: this.getMaxTokens(input.length),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: `OpenAI API error: ${error.error?.message || 'Unknown error'}`,
          tokensUsed: 0,
        }
      }

      const data = await response.json()
      const message = data.choices[0]?.message?.content || ''
      const tokensUsed = data.usage?.total_tokens || 0

      return {
        success: true,
        message,
        tokensUsed,
      }
    } catch (error) {
      console.error('OpenAI provider error:', error)
      return {
        success: false,
        error: `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokensUsed: 0,
      }
    }
  }

  estimateTokens(input: GenerateMessageInput): number {
    // Rough estimation: ~1 token per 4 characters
    const prompt = getPrompt(input.messageType, input.tone)
    const userPrompt = this.buildUserPrompt(input)
    const totalText = prompt + userPrompt
    return Math.ceil(totalText.length / 4) + this.getMaxTokens(input.length)
  }

  private buildUserPrompt(input: GenerateMessageInput): string {
    return `
Generate a ${input.length.toLowerCase()} ${input.messageType.replace(/_/g, ' ').toLowerCase()} message.

Lead Information:
- Name: ${input.leadName}
- Company: ${input.company || 'Not specified'}
- Role: ${input.role || 'Not specified'}
- Industry: ${input.industry || 'Not specified'}
- Pain Points: ${input.painPoints || 'Not specified'}

Product/Service:
- Name: ${input.productName}
- Value Proposition: ${input.valueProposition}

Tone: ${input.tone.toLowerCase()}
Length: ${input.length.toLowerCase()}

${input.pastNotes ? `Previous Context: ${input.pastNotes}` : ''}

Please generate a professional, personalized message that:
1. Acknowledges the lead's specific situation
2. Highlights relevant value proposition
3. Calls to action appropriate to message type
4. Uses the specified tone
5. Fits within the length requirements
`
  }

  private getMaxTokens(length: string): number {
    switch (length) {
      case 'SHORT':
        return 100
      case 'MEDIUM':
        return 300
      case 'LONG':
        return 500
      default:
        return 300
    }
  }
}
