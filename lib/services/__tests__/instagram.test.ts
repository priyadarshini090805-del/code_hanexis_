import { InstagramService, InstagramPublishError } from '../instagram.service';

describe('InstagramService', () => {
  describe('validateMedia', () => {
    it('should reject missing image URL', () => {
      expect(InstagramService.validateMedia('', 'caption')).toBe('Instagram requires an image URL.');
    });

    it('should reject captions over 2200 characters', () => {
      const longCaption = 'a'.repeat(2201);
      expect(InstagramService.validateMedia('https://example.com/img.jpg', longCaption)).toMatch(/2200/);
    });

    it('should reject unsupported image formats', () => {
      expect(InstagramService.validateMedia('https://example.com/file.gif', 'cap')).toMatch(/Unsupported/);
      expect(InstagramService.validateMedia('https://example.com/file.bmp', 'cap')).toMatch(/Unsupported/);
      expect(InstagramService.validateMedia('https://example.com/file.svg', 'cap')).toMatch(/Unsupported/);
    });

    it('should accept valid JPEG images', () => {
      expect(InstagramService.validateMedia('https://example.com/photo.jpg', 'Nice photo')).toBeNull();
      expect(InstagramService.validateMedia('https://example.com/photo.jpeg', 'Nice photo')).toBeNull();
    });

    it('should accept valid PNG images', () => {
      expect(InstagramService.validateMedia('https://example.com/photo.png', 'A post')).toBeNull();
    });

    it('should accept valid WebP images', () => {
      expect(InstagramService.validateMedia('https://example.com/photo.webp', 'Modern')).toBeNull();
    });

    it('should accept URLs with query parameters', () => {
      expect(InstagramService.validateMedia('https://cdn.example.com/img.jpg?w=800&h=600', 'Resized')).toBeNull();
    });

    it('should accept captions at the 2200 character limit', () => {
      const maxCaption = 'a'.repeat(2200);
      expect(InstagramService.validateMedia('https://example.com/img.jpg', maxCaption)).toBeNull();
    });

    it('should accept extension-less CDN URLs', () => {
      expect(InstagramService.validateMedia('https://cdn.example.com/abc123', 'CDN image')).toBeNull();
    });

    it('should accept URLs with only query params and no extension', () => {
      expect(InstagramService.validateMedia('https://images.example.com/media?id=10', 'Query image')).toBeNull();
    });

    it('should accept object storage URLs without extensions', () => {
      expect(InstagramService.validateMedia('https://storage.example.com/bucket/object', 'Storage')).toBeNull();
    });
  });

  describe('isTemporaryError', () => {
    it('should classify HTTP 429 as temporary', () => {
      expect(InstagramService.isTemporaryError(429, '{}')).toBe(true);
    });

    it('should classify HTTP 500 as temporary', () => {
      expect(InstagramService.isTemporaryError(500, '{}')).toBe(true);
    });

    it('should classify HTTP 503 as temporary', () => {
      expect(InstagramService.isTemporaryError(503, '{}')).toBe(true);
    });

    it('should classify Graph API error code 1 as temporary', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 1 } }))).toBe(true);
    });

    it('should classify Graph API error code 2 as temporary', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 2 } }))).toBe(true);
    });

    it('should classify Graph API error code 4 as temporary', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 4 } }))).toBe(true);
    });

    it('should classify Graph API error code 17 as temporary', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 17 } }))).toBe(true);
    });

    it('should classify Graph API error code 341 as temporary', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 341 } }))).toBe(true);
    });

    it('should classify HTTP 400 without known code as permanent', () => {
      expect(InstagramService.isTemporaryError(400, JSON.stringify({ error: { code: 100 } }))).toBe(false);
    });

    it('should classify HTTP 403 as permanent', () => {
      expect(InstagramService.isTemporaryError(403, '{}')).toBe(false);
    });

    it('should handle non-JSON error bodies gracefully', () => {
      expect(InstagramService.isTemporaryError(400, 'plain text error')).toBe(false);
    });

    it('should handle empty error bodies', () => {
      expect(InstagramService.isTemporaryError(400, '')).toBe(false);
    });
  });

  describe('InstagramPublishError', () => {
    it('should carry temporary flag', () => {
      const err = new InstagramPublishError('Rate limited', 429, true);
      expect(err.temporary).toBe(true);
      expect(err.metaStatusCode).toBe(429);
      expect(err.message).toBe('Rate limited');
      expect(err.name).toBe('InstagramPublishError');
    });

    it('should carry permanent flag', () => {
      const err = new InstagramPublishError('Bad request', 400, false);
      expect(err.temporary).toBe(false);
      expect(err.metaStatusCode).toBe(400);
    });

    it('should be instanceof Error', () => {
      const err = new InstagramPublishError('test', 500, true);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(InstagramPublishError);
    });
  });

  describe('exponential backoff calculation', () => {
    it('should produce 5m, 10m, 20m for attempts 0, 1, 2', () => {
      const backoff = (attempt: number) => Math.pow(2, attempt) * 5 * 60 * 1000;
      expect(backoff(0)).toBe(5 * 60 * 1000);
      expect(backoff(1)).toBe(10 * 60 * 1000);
      expect(backoff(2)).toBe(20 * 60 * 1000);
    });
  });
});
