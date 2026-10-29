import nodemailer from 'nodemailer';

// Resilient App Password normalization (removes unintentional spaces)
const rawSmtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Port 587 requires STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: rawSmtpPass,
  },
});

// Helper: Safety check before triggering socket
function hasSmtpConfig(): boolean {
  if (!process.env.SMTP_USER || !rawSmtpPass) {
    console.warn('[MAILER WARNING] SMTP credentials not detected in environment variables.');
    return false;
  }
  return true;
}

// 1. Email OTP Verification Dispatch
export async function sendOtpEmail(toEmail: string, otp: string) {
  if (!hasSmtpConfig()) return;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: auto; padding: 28px; border: 1px solid #1e293b; border-radius: 16px; background: #07090E; color: #f8fafc;">
      <div style="border-bottom: 2px solid #f97316; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #f97316; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
          VIQ Technologies // Verification Terminal
        </span>
        <h2 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">
          Account Verification Code
        </h2>
      </div>

      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 22px;">
        Use the following single-use authorization passcode (OTP) to authenticate your access. This code remains active for <strong>10 minutes</strong>.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f97316; background: #131926; padding: 16px 32px; border-radius: 12px; border: 1px dashed #f97316; font-family: monospace;">
          ${otp}
        </span>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        If you did not initiate this authentication request, disregard this transmission. Never disclose security tokens to any third party.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"VIQ Cloud Auth" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[VIQ Auth] Security Verification Code: ${otp}`,
    html,
  });
}

// 2. Partial Payment & Fee Receipt Dispatch
interface PaymentReceiptPayload {
  toEmail: string;
  studentName: string;
  amountReceived: number;
  outstandingBalance: number;
  receiptNumber: string;
  paymentMode?: string;
  receiptUrl?: string;
  instituteName?: string;
}

export async function sendPaymentReceiptEmail({
  toEmail,
  studentName,
  amountReceived,
  outstandingBalance,
  receiptNumber,
  paymentMode = 'CASH',
  receiptUrl,
  instituteName = 'VIQ Technologies',
}: PaymentReceiptPayload) {
  if (!hasSmtpConfig()) return;

  const formattedReceived = amountReceived.toLocaleString('en-IN');
  const formattedBalance = outstandingBalance.toLocaleString('en-IN');
  const viewReceiptUrl = receiptUrl || '#';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: auto; padding: 28px; border: 1px solid #1e293b; border-radius: 16px; background: #07090E; color: #f8fafc;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
          ${instituteName} // Fee Transaction Engine
        </span>
        <h2 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">
          Payment Confirmation Receipt
        </h2>
      </div>

      <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin-bottom: 14px;">
        Dear <strong>${studentName}</strong>,
      </p>

      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Payment of <strong>₹${formattedReceived}</strong> has been successfully processed and accredited against your institutional ledger.
      </p>

      <table style="width: 100%; border-collapse: collapse; background: #0D111A; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
        <tbody>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Receipt Number:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #f8fafc; font-family: monospace; font-weight: 700; text-align: right;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Payment Mode:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #f8fafc; font-family: monospace; font-weight: 700; text-align: right;">${paymentMode}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Amount Received:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #10b981; font-family: monospace; font-weight: 800; text-align: right;">₹${formattedReceived}</td>
          </tr>
          <tr style="border-top: 1px dashed #1e293b;">
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Outstanding Balance:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: ${outstandingBalance > 0 ? '#f97316' : '#10b981'}; font-family: monospace; font-weight: 800; text-align: right;">₹${formattedBalance}</td>
          </tr>
        </tbody>
      </table>

      ${
        receiptUrl && receiptUrl !== '#'
          ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${viewReceiptUrl}" style="background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; display: inline-block;">
            Download Official Receipt PDF
          </a>
        </div>
      `
          : ''
      }

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        Thank you for choosing ${instituteName}. For queries regarding installment schedules, connect with your regional cashier desk.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${instituteName} Accounts" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Fee Payment Confirmation [₹${formattedReceived}] - ${receiptNumber}`,
    html,
  });
}

// 3. Automated EMI Due Date Alert
interface EmiAlertPayload {
  toEmail: string;
  studentName: string;
  installmentAmount: number;
  dueDate: string;
  daysRemaining?: number;
  instituteName?: string;
  remainingBalance?: number;
}

export async function sendEmiReminderEmail({
  toEmail,
  studentName,
  installmentAmount,
  dueDate,
  daysRemaining = 3,
  instituteName = 'VIQ Technologies',
  remainingBalance,
}: EmiAlertPayload) {
  if (!hasSmtpConfig()) return;

  const urgencyLabel =
    daysRemaining <= 1
      ? 'URGENT: Due Tomorrow'
      : daysRemaining === 2
      ? 'Action Required: Due in 2 Days'
      : `Reminder: Due in ${daysRemaining} Days`;

  const formattedAmount = installmentAmount.toLocaleString('en-IN');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: auto; padding: 28px; border: 1px solid #7c2d12; border-radius: 16px; background: #07090E; color: #f8fafc;">
      <div style="border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
          ${urgencyLabel}
        </span>
        <h2 style="margin: 8px 0 0 0; color: #ffffff; font-size: 19px; font-weight: 800;">
          Scheduled Course EMI Notification
        </h2>
      </div>

      <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Dear <strong>${studentName}</strong>,
      </p>

      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        An upcoming installment of <strong style="color: #ffffff;">₹${formattedAmount}</strong> is scheduled for payment on <strong style="color: #f97316;">${dueDate}</strong> (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining).
      </p>

      <div style="background: #1c130d; border-left: 4px solid #ea580c; border-radius: 8px; padding: 14px; margin-bottom: 22px;">
        <p style="margin: 0; color: #fdba74; font-size: 13px; line-height: 1.5;">
          Please clear outstanding balances before deadline expiration to prevent batch suspension.
        </p>
        ${
          remainingBalance !== undefined
            ? `<div style="margin-top: 8px; font-size: 12px; color: #fb923c; font-family: monospace;">Total Pending Ledger Balance: <strong>₹${remainingBalance.toLocaleString('en-IN')}</strong></div>`
            : ''
        }
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        ${instituteName} Financial Operations Office
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${instituteName} Fee Desk" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[${urgencyLabel}] Course Fee Installment Reminder - Due ${dueDate}`,
    html,
  });
}

// 4. Official Notice Broadcast Email
interface NoticeBroadcastPayload {
  toEmails: string[];
  title: string;
  content: string;
  senderName: string;
  senderRole: string;
  portalUrl?: string;
}

export async function sendNoticeBroadcastEmail({
  toEmails,
  title,
  content,
  senderName,
  senderRole,
  portalUrl = 'https://portal.viqtechnologies.com',
}: NoticeBroadcastPayload) {
  if (!hasSmtpConfig() || !toEmails || toEmails.length === 0) return;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #1e293b; border-radius: 16px; background: #07090E; color: #f8fafc;">
      <div style="border-bottom: 2px solid #f97316; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #f97316; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
          VIQ Technologies // Official Circular
        </span>
        <h2 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">
          ${title}
        </h2>
      </div>

      <div style="color: #cbd5e1; font-size: 14px; line-height: 1.7; margin-bottom: 24px; white-space: pre-line;">
        ${content}
      </div>

      <div style="background: #0D111A; padding: 12px 18px; border-radius: 10px; font-size: 12px; color: #94a3b8; margin-bottom: 24px; border: 1px solid #1e293b;">
        Authorized Dispatcher: <strong style="color: #ffffff;">${senderName}</strong> (${senderRole})
      </div>

      <div style="text-align: center;">
        <a href="${portalUrl}" style="background: #f97316; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; display: inline-block;">
          Open Portal Terminal
        </a>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VIQ Academic Desk" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    bcc: toEmails,
    subject: `[OFFICIAL CIRCULAR] ${title}`,
    html,
  });
}