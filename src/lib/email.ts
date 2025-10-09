import nodemailer from "nodemailer";

import { env } from "@/env";

// Email configuration interface
export interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Email response interface
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

// Send email function
export const sendEmail = async (
  config: EmailConfig,
): Promise<EmailResponse> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to: Array.isArray(config.to) ? config.to.join(", ") : config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      cc: config.cc
        ? Array.isArray(config.cc)
          ? config.cc.join(", ")
          : config.cc
        : undefined,
      bcc: config.bcc
        ? Array.isArray(config.bcc)
          ? config.bcc.join(", ")
          : config.bcc
        : undefined,
      attachments: config.attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Verify SMTP connection
export const verifySMTPConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP connection verification failed:", error);
    return false;
  }
};

// Utility function to send welcome email
export const sendWelcomeEmail = async (
  to: string,
  userName: string,
): Promise<EmailResponse> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to Fitlink!</h1>
      <p>Hello ${userName},</p>
      <p>Thank you for joining Fitlink! We're excited to have you on board.</p>
      <p>You can now start exploring our platform and connecting with coaches and clubs.</p>
      <p>Best regards,<br>The Fitlink Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Welcome to Fitlink!",
    html,
    text: `Welcome to Fitlink! Hello ${userName}, thank you for joining Fitlink! We're excited to have you on board.`,
  });
};

// Utility function to send password reset email
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  userName: string,
): Promise<EmailResponse> => {
  const resetUrl = `${env.NEXT_PUBLIC_HOSTNAME}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Password Reset Request</h1>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>The Fitlink Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Password Reset Request - Fitlink",
    html,
    text: `Password Reset Request - Hello ${userName}, we received a request to reset your password. Visit ${resetUrl} to reset it. If you didn't request this, please ignore this email.`,
  });
};

// Utility function to send notification email
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  userName: string,
): Promise<EmailResponse> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">${subject}</h1>
      <p>Hello ${userName},</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
        ${message}
      </div>
      <p>Best regards,<br>The Fitlink Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `${subject} - Hello ${userName}, ${message}`,
  });
};
