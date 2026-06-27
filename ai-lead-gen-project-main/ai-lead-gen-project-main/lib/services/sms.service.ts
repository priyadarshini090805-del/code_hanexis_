export interface SMSOptions {
  to: string;
  body: string;
  from?: string;
}

export interface WhatsAppOptions {
  to: string;
  body: string;
  mediaUrl?: string;
}

export class SMSService {
  private static accountSid = process.env.TWILIO_ACCOUNT_SID;
  private static authToken = process.env.TWILIO_AUTH_TOKEN;
  private static phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  private static whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  private static validateConfig(): void {
    if (!this.accountSid || !this.authToken) {
      throw new Error(
        'Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
      );
    }
  }

  static async sendSMS(options: SMSOptions): Promise<string> {
    this.validateConfig();

    if (!this.phoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const params = new URLSearchParams({
      From: options.from || this.phoneNumber,
      To: options.to,
      Body: options.body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio SMS failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.sid;
  }

  static async sendWhatsApp(options: WhatsAppOptions): Promise<string> {
    this.validateConfig();

    if (!this.whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const params = new URLSearchParams({
      From: `whatsapp:${this.whatsappNumber}`,
      To: `whatsapp:${options.to}`,
      Body: options.body,
    });

    if (options.mediaUrl) {
      params.append('MediaUrl', options.mediaUrl);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio WhatsApp failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.sid;
  }

  static async sendLeadAlert(phone: string, leadName: string, company: string): Promise<string> {
    const message = `New lead: ${leadName} from ${company}. Check HaneXes for details.`;
    return this.sendSMS({ to: phone, body: message });
  }

  static async sendCampaignReminder(
    phone: string,
    campaignName: string,
    followUpTime: string
  ): Promise<string> {
    const message = `Reminder: Follow up with ${campaignName} prospects at ${followUpTime}`;
    return this.sendSMS({ to: phone, body: message });
  }

  static async sendVerificationCode(phone: string, code: string): Promise<string> {
    const message = `Your HaneXes verification code is: ${code}`;
    return this.sendSMS({ to: phone, body: message });
  }

  static async verifyWebhookSignature(
    signature: string,
    url: string,
    data: Record<string, string>
  ): Promise<boolean> {
    const crypto = require('crypto');
    const sortedParams = Object.keys(data)
      .sort()
      .map(key => key + data[key])
      .join('');

    const hash = crypto
      .createHmac('sha1', this.authToken)
      .update(url + sortedParams)
      .digest('base64');

    return hash === signature;
  }
}
