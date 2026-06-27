import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-32ch'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-key-for-testing'
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'
