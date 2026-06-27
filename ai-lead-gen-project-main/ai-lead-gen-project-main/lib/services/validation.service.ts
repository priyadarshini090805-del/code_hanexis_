export class ValidationService {
  static validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 254;
  }

  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  static validateLinkedInUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'linkedin.com' || parsed.hostname === 'www.linkedin.com';
    } catch {
      return false;
    }
  }

  static validateCompanyName(name: string): boolean {
    return name.length >= 2 && name.length <= 255;
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 1000);
  }

  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email).toLowerCase();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  static validateLeadData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.email && !this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !this.validatePhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    if (data.linkedinUrl && !this.validateLinkedInUrl(data.linkedinUrl)) {
      errors.push('Invalid LinkedIn URL');
    }

    if (!data.firstName || !this.validateCompanyName(data.firstName)) {
      errors.push('Invalid first name');
    }

    if (!data.lastName || !this.validateCompanyName(data.lastName)) {
      errors.push('Invalid last name');
    }

    if (data.company && !this.validateCompanyName(data.company)) {
      errors.push('Invalid company name');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static normalizeLead(data: any) {
    return {
      firstName: this.sanitizeString(data.firstName || ''),
      lastName: this.sanitizeString(data.lastName || ''),
      email: data.email ? this.sanitizeEmail(data.email) : null,
      phone: data.phone ? this.sanitizePhone(data.phone) : null,
      company: data.company ? this.sanitizeString(data.company) : null,
      location: data.location ? this.sanitizeString(data.location) : null,
      linkedinUrl: data.linkedinUrl ? this.sanitizeString(data.linkedinUrl) : null,
    };
  }
}
