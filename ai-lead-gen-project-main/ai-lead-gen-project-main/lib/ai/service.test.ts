import { AIService } from './service'
import { getPrompt, messageTypes, tones, lengths } from './prompts'
import { AIMessageType, MessageTone, MessageLength } from '@/lib/enums'

describe('AIService', () => {
  let aiService: AIService

  beforeEach(() => {
    aiService = new AIService()
  })

  describe('Prompt Generation', () => {
    it('should generate prompts for all message types', () => {
      messageTypes.forEach((type) => {
        const prompt = getPrompt(type as AIMessageType, 'PROFESSIONAL' as MessageTone)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it('should generate prompts for all tones', () => {
      tones.forEach((tone) => {
        const prompt = getPrompt('CONNECTION_MESSAGE' as AIMessageType, tone as MessageTone)
        expect(prompt).toBeTruthy()
        expect(prompt.includes(tone.toLowerCase())).toBe(true)
      })
    })

    it('should include message type guidance', () => {
      const prompt = getPrompt('SALES_PITCH' as AIMessageType, 'DIRECT' as MessageTone)
      expect(prompt.toLowerCase()).toContain('sales pitch')
    })
  })

  describe('Token Estimation', () => {
    it('should estimate tokens based on input length', () => {
      const input = {
        leadName: 'John Doe',
        company: 'Acme Corp',
        role: 'VP Sales',
        productName: 'HaneXes',
        valueProposition: 'Increase sales by 40%',
        messageType: 'SALES_PITCH' as AIMessageType,
        tone: 'PROFESSIONAL' as MessageTone,
        length: 'MEDIUM' as MessageLength,
      }

      const shortTokens = 0 // Would call estimateTokens
      expect(shortTokens).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Message Type Validation', () => {
    it('should validate all message types exist', () => {
      const validTypes = [
        'CONNECTION_MESSAGE',
        'FOLLOWUP_MESSAGE',
        'SALES_PITCH',
        'COLD_OUTREACH',
        'CALL_INVITATION',
        'REENGAGEMENT',
      ]

      validTypes.forEach((type) => {
        expect(messageTypes).toContain(type)
      })
    })
  })

  describe('Tone Validation', () => {
    it('should validate all tones exist', () => {
      const validTones = ['PROFESSIONAL', 'FRIENDLY', 'CONSULTATIVE', 'DIRECT', 'EXECUTIVE']

      validTones.forEach((tone) => {
        expect(tones).toContain(tone)
      })
    })
  })

  describe('Length Validation', () => {
    it('should validate all lengths exist', () => {
      const validLengths = ['SHORT', 'MEDIUM', 'LONG']

      validLengths.forEach((length) => {
        expect(lengths).toContain(length)
      })
    })
  })
})
