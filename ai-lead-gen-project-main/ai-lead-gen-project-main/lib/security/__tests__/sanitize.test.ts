import { sanitizeInput, escapeHtml, validateEmail, validatePhoneNumber, sanitizeUrl } from '../sanitize'

describe('Sanitization Utilities', () => {
  describe('Input Sanitization', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World'
      const sanitized = sanitizeInput(input)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("XSS")')
    })

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')" />'
      const sanitized = sanitizeInput(input)
      expect(sanitized).not.toContain('onerror')
    })

    it('should remove null bytes', () => {
      const input = 'Hello\0World'
      const sanitized = sanitizeInput(input)
      expect(sanitized).not.toContain('\0')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe('Hello World')
    })
  })

  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const html = '<script>alert("XSS")</script>'
      const escaped = escapeHtml(html)

      expect(escaped).not.toContain('<')
      expect(escaped).not.toContain('>')
      expect(escaped).toContain('&lt;')
      expect(escaped).toContain('&gt;')
    })

    it('should escape quotes', () => {
      const html = 'Hello "World" & \'Friends\''
      const escaped = escapeHtml(html)

      expect(escaped).toContain('&quot;')
      expect(escaped).toContain('&#039;')
      expect(escaped).toContain('&amp;')
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
      expect(sanitizeUrl('http://example.com/path')).toBeTruthy()
    })

    it('should reject URLs with invalid protocols', () => {
      expect(sanitizeUrl('javascript:alert("XSS")')).toBe('')
      expect(sanitizeUrl('data:text/html,<script>alert("XSS")</script>')).toBe('')
    })
  })

  describe('Phone Number Validation', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+1-234-567-8900')).toBe(true)
      expect(validatePhoneNumber('(234) 567-8900')).toBe(true)
      expect(validatePhoneNumber('2345678900')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false)
      expect(validatePhoneNumber('abcdefghij')).toBe(false)
    })

    it('should allow empty phone numbers', () => {
      expect(validatePhoneNumber('')).toBe(true)
    })
  })
})
