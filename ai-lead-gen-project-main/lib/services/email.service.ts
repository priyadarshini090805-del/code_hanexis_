import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    if (sendgridKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: sendgridKey,
        },
      });
    } else if (smtpHost && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    } else {
      throw new Error(
        'Email configuration missing. Set SENDGRID_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASSWORD'
      );
    }

    return this.transporter;
  }

  static async send(options: EmailOptions): Promise<string> {
    const transporter = this.getTransporter();

    const result = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || 'noreply@hanexes.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    return result.messageId;
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<string> {
    return this.send({
      to: email,
      subject: 'Welcome to HaneXes',
      html: `
        <h2>Welcome to HaneXes, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Log in to start managing your leads and campaigns.</p>
        <a href="${process.env.APP_URL}/login">Login to HaneXes</a>
      `,
    });
  }

  static async sendPasswordReset(email: string, resetToken: string): Promise<string> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    return this.send({
      to: email,
      subject: 'Reset Your HaneXes Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
  }

  static async sendCampaignNotification(
    email: string,
    campaignName: string,
    status: string
  ): Promise<string> {
    return this.send({
      to: email,
      subject: `Campaign "${campaignName}" ${status}`,
      html: `
        <h2>Campaign Update</h2>
        <p>Your campaign <strong>${campaignName}</strong> has been <strong>${status}</strong>.</p>
      `,
    });
  }

  static async sendLeadAlert(
    email: string,
    leadName: string,
    leadEmail: string,
    company: string
  ): Promise<string> {
    return this.send({
      to: email,
      subject: `New Lead: ${leadName} from ${company}`,
      html: `
        <h2>New Lead Alert</h2>
        <p><strong>${leadName}</strong></p>
        <p>Company: ${company}</p>
        <p>Email: ${leadEmail}</p>
        <a href="${process.env.APP_URL}/dashboard/leads">View Lead</a>
      `,
    });
  }

  static async sendApprovalRequest(
    email: string,
    itemType: string,
    itemName: string,
    approvalUrl: string
  ): Promise<string> {
    return this.send({
      to: email,
      subject: `Approval Needed: ${itemType} - ${itemName}`,
      html: `
        <h2>Approval Request</h2>
        <p>A <strong>${itemType}</strong> needs your approval: <strong>${itemName}</strong></p>
        <a href="${approvalUrl}">Review and Approve</a>
      `,
    });
  }

  static async sendBulk(emails: EmailOptions[]): Promise<string[]> {
    return Promise.all(emails.map(email => this.send(email)));
  }
}
