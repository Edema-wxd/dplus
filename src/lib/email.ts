export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await sendViaResend(payload, resendKey);
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    await sendViaNodemailer(payload);
    return;
  }

  console.log(
    "[email] No transport configured (RESEND_API_KEY / SMTP_HOST missing) — skipping:",
    payload.subject
  );
}

async function sendViaResend(
  { to, subject, html }: EmailPayload,
  apiKey: string
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "De-Sign Plus <no-reply@designplus.co.za>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaNodemailer(
  { to, subject, html }: EmailPayload
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const from = process.env.EMAIL_FROM ?? "De-Sign Plus <no-reply@designplus.co.za>";
  await transporter.sendMail({ from, to, subject, html });
}
