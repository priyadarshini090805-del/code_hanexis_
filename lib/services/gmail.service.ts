export interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GmailService {
  private static config: GmailOAuthConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/google/callback`,
  };

  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async exchangeCodeForToken(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  static async refreshAccessToken(refreshToken: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    return response.json();
  }

  static async getProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get Gmail profile');
    }

    return response.json();
  }

  static async listEmails(accessToken: string, query: string = ''): Promise<any[]> {
    const params = new URLSearchParams({ q: query, maxResults: '10' });
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?${params}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error('Failed to list emails');
    }

    const data = await response.json();
    return data.messages || [];
  }

  static async sendEmail(
    accessToken: string,
    to: string,
    subject: string,
    body: string
  ): Promise<string> {
    const message = `From: me\r\nTo: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
    const base64Message = Buffer.from(message).toString('base64');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64Message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return data.id;
  }

  static async extractLeadFromEmail(emailId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      return null;
    }

    const email = await response.json();
    const headers = email.payload?.headers || [];
    
    return {
      senderName: headers.find((h: any) => h.name === 'From')?.value,
      senderEmail: headers.find((h: any) => h.name === 'From')?.value?.match(/[\w\.\-]+@[\w\.\-]+/)?.[0],
      subject: headers.find((h: any) => h.name === 'Subject')?.value,
      timestamp: email.internalDate,
    };
  }
}
