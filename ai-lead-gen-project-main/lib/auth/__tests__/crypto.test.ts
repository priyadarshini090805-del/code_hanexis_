import { hashPassword, verifyPassword, generateAccessToken, verifyToken, TokenPayload } from '../crypto'

describe('Crypto Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toEqual(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should verify a correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate an access token', () => {
      const payload: TokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT format: header.payload.signature
    })

    it('should verify a valid access token', () => {
      const payload: TokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.id).toBe(payload.id)
      expect(decoded?.email).toBe(payload.email)
      expect(decoded?.role).toBe(payload.role)
    })

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)

      expect(decoded).toBeNull()
    })

    it('should reject a tampered token', () => {
      const payload: TokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload)
      const tamperedToken = token.slice(0, -1) + 'x' // Change last character

      const decoded = verifyToken(tamperedToken)
      expect(decoded).toBeNull()
    })
  })
})
