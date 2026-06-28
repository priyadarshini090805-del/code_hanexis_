import { InstagramService } from '../instagram.service';

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
  });
});
