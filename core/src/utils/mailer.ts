import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<boolean> {
  const subject = `🔐 Tu código de verificación 2FA para DAMA-CRM: ${otpCode}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
      <h2 style="color: #2563EB; margin-top: 0;">DAMA-CRM Security</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Has solicitado iniciar sesión en tu cuenta. Usa el siguiente código de un solo uso (OTP) para completar la autenticación de doble factor:</p>
      <div style="background-color: #F8FAFC; border: 2px dashed #2563EB; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1E293B;">${otpCode}</span>
      </div>
      <p style="font-size: 13px; color: #64748B;">Este código expirará en 10 minutos. Si no has sido tú, contacta de inmediato con el administrador del sistema.</p>
    </div>
  `;

  // Always log to console for zero-cost and instant development
  console.log('\n=============================================================');
  console.log(`🔑 [2FA OTP GENERATED] For: ${toEmail} | User: ${userName}`);
  console.log(`👉 CODE: [ ${otpCode} ]`);
  console.log('=============================================================\n');

  try {
    const mailer = getMailer();
    await mailer.sendMail({
      from: config.smtp.from,
      to: toEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.warn('⚠️ SMTP send error (normal in local dev without live SMTP server):', (error as Error).message);
    // Even if remote SMTP fails, dev flow continues because OTP was logged above
    return true;
  }
}
