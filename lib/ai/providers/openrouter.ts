import { AIProvider, GenerateMessageInput, AIProviderResponse } from './interface'
import { getPrompt } from '../prompts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'
  private apiKey = process.env.OPENROUTER_API_KEY

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-openrouter-api-key' && !this.apiKey.startsWith('YOUR_')
  }

  async generateMessage(input: GenerateMessageInput): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'OpenRouter API key not configured',
        tokensUsed: 0,
      }
    }

    try {
      const systemPrompt = getPrompt(input.messageType, input.tone)
      const userPrompt = this.buildUserPrompt(input)

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'HaneXes',
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
          error: `OpenRouter API error: ${error.error?.message || 'Unknown error'}`,
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
      console.error('OpenRouter provider error:', error)
      return {
        success: false,
        error: `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokensUsed: 0,
      }
    }
  }

  /**
   * Generic chat completion for use cases beyond lead-message generation
   * (e.g. conversation reply suggestions). Returns the raw assistant text.
   */
  async chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'OpenRouter API key not configured', tokensUsed: 0 }
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'HaneXes',
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: opts?.maxTokens ?? 400,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `OpenRouter API error: ${error.error?.message || response.statusText}`,
          tokensUsed: 0,
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: data.choices[0]?.message?.content || '',
        tokensUsed: data.usage?.total_tokens || 0,
      }
    } catch (error) {
      console.error('OpenRouter chat error:', error)
      return {
        success: false,
        error: `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokensUsed: 0,
      }
    }
  }

  estimateTokens(input: GenerateMessageInput): number {
    // Rough estimation
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

Please generate a professional, personalized message.
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
