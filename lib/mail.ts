import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // 16-character Google App Password
  },
});

// 1. Email OTP Verification Dispatch
export async function sendOtpEmail(toEmail: string, otp: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
      <div style="border-bottom: 2px solid #f97316; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #f97316; text-transform: uppercase; letter-spacing: 1.5px;">
          VIQ Technologies // Verification Terminal
        </span>
        <h2 style="margin: 8px 0 0 0; color: #0f172a; font-size: 20px; font-weight: 800;">
          Account Verification Code
        </h2>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Use the following one-time passcode (OTP) to verify your official email and complete your registration. This code is valid for <strong>10 minutes</strong>.
      </p>

      <div style="text-align: center; margin: 26px 0;">
        <span style="display: inline-block; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #f97316; background: #fff7ed; padding: 14px 28px; border-radius: 10px; border: 1px dashed #fdba74; font-family: monospace;">
          ${otp}
        </span>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
        If you did not initiate this registration request, please disregard this email. Never disclose your credentials or security codes to anyone.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"VIQ Cloud Auth" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[VIQ Auth] Verification Code: ${otp}`,
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
  const formattedReceived = amountReceived.toLocaleString('en-IN');
  const formattedBalance = outstandingBalance.toLocaleString('en-IN');
  const viewReceiptUrl = receiptUrl || '#';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px;">
          ${instituteName} // Fee Transaction Engine
        </span>
        <h2 style="margin: 8px 0 0 0; color: #0f172a; font-size: 20px; font-weight: 800;">
          Payment Confirmation Receipt
        </h2>
      </div>

      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 14px;">
        Dear <strong>${studentName}</strong>,
      </p>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Payment of <strong>₹${formattedReceived}</strong> has been received successfully toward your course fee/EMI.
      </p>

      <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
        <tbody>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #64748b;">Receipt Number:</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-family: monospace; font-weight: 700; text-align: right;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #64748b;">Payment Mode:</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-family: monospace; font-weight: 700; text-align: right;">${paymentMode}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #64748b;">Amount Received:</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #10b981; font-family: monospace; font-weight: 800; text-align: right;">₹${formattedReceived}</td>
          </tr>
          <tr style="border-top: 1px dashed #cbd5e1;">
            <td style="padding: 10px 14px; font-size: 13px; color: #64748b;">Outstanding Balance:</td>
            <td style="padding: 10px 14px; font-size: 13px; color: ${outstandingBalance > 0 ? '#ea580c' : '#10b981'}; font-family: monospace; font-weight: 800; text-align: right;">₹${formattedBalance}</td>
          </tr>
        </tbody>
      </table>

      ${
        receiptUrl && receiptUrl !== '#'
          ? `
        <div style="text-align: center; margin-bottom: 22px;">
          <a href="${viewReceiptUrl}" style="background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">
            Download Official Receipt PDF
          </a>
        </div>
      `
          : ''
      }

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
        Thank you for choosing ${instituteName}. For queries regarding your fee schedule, contact your branch coordinator.
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
  const urgencyLabel =
    daysRemaining <= 1
      ? 'URGENT: Due Tomorrow'
      : daysRemaining === 2
      ? 'Action Required: Due in 2 Days'
      : `Reminder: Due in ${daysRemaining} Days`;

  const formattedAmount = installmentAmount.toLocaleString('en-IN');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 28px; border: 1px solid #fed7aa; border-radius: 14px; background: #ffffff;">
      <div style="border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1.5px;">
          ${urgencyLabel}
        </span>
        <h2 style="margin: 8px 0 0 0; color: #0f172a; font-size: 19px; font-weight: 800;">
          Scheduled Course EMI Notification
        </h2>
      </div>

      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Dear <strong>${studentName}</strong>,
      </p>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        This is a friendly reminder that an EMI installment of <strong style="color: #0f172a;">₹${formattedAmount}</strong> is scheduled for payment on <strong style="color: #ea580c;">${dueDate}</strong> (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining).
      </p>

      <table style="width: 100%; border-collapse: collapse; background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px; margin-bottom: 22px;">
        <tbody>
          <tr>
            <td style="padding: 12px 14px; color: #9a3412; font-size: 13px; line-height: 1.5;">
              Please clear the dues before the deadline to prevent batch access interruption.
              ${
                remainingBalance !== undefined
                  ? `<div style="margin-top: 6px; font-size: 12px; color: #c2410c;">Total Pending Course Balance: <strong>₹${remainingBalance.toLocaleString('en-IN')}</strong></div>`
                  : ''
              }
            </td>
          </tr>
        </tbody>
      </table>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
        ${instituteName} Financial Administration
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
  if (!toEmails || toEmails.length === 0) return;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 26px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #f97316; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 800; color: #f97316; text-transform: uppercase; letter-spacing: 1.5px;">
          VIQ Technologies // Official Circular
        </span>
        <h2 style="margin: 8px 0 0 0; color: #0f172a; font-size: 20px; font-weight: 800;">
          ${title}
        </h2>
      </div>

      <div style="color: #334155; font-size: 14px; line-height: 1.65; margin-bottom: 24px; white-space: pre-line;">
        ${content}
      </div>

      <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #64748b; margin-bottom: 24px; border: 1px solid #f1f5f9;">
        Issued By: <strong style="color: #0f172a;">${senderName}</strong> (${senderRole})
      </div>

      <div style="text-align: center;">
        <a href="${portalUrl}" style="background: #f97316; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block;">
          Open Portal Desk
        </a>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VIQ Academic Desk" <${process.env.SMTP_USER}>`,
    bcc: toEmails,
    subject: `[VIQ NOTICE] ${title}`,
    html,
  });
}