import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

export interface EmailBranding {
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: '2fa_otp' | 'welcome_invitation' | 'quote_signature' | 'invoice_issued' | 'alert_notification' | 'task_assigned' | 'clockin_reminder' | 'custom';
  variables: Record<string, any>;
  tenantId?: string;
  attachments?: Array<{ filename: string; content?: any; path?: string }>;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || 'localhost';
      const port = parseInt(process.env.SMTP_PORT || '1025', 10);
      const secure = process.env.SMTP_SECURE === 'true';
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      const auth = (user && pass && user !== 'notificaciones@tudominio.com')
        ? { user, pass }
        : undefined;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
        tls: { rejectUnauthorized: false },
      });
    }
    return this.transporter;
  }

  public static async getTenantBranding(tenantId?: string): Promise<EmailBranding> {
    const defaultBranding: EmailBranding = {
      companyName: 'DAMA-CRM',
      companyLogo: '',
      primaryColor: '#6366F1',
      supportEmail: 'soporte@dama-crm.com',
      websiteUrl: 'https://damacrm.com',
    };

    if (!tenantId) return defaultBranding;

    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant?.branding) {
        const parsed = typeof tenant.branding === 'string' ? JSON.parse(tenant.branding) : tenant.branding;
        return {
          companyName: parsed.companyName || tenant.name || defaultBranding.companyName,
          companyLogo: parsed.logoUrl || parsed.companyLogo || '',
          primaryColor: parsed.primaryColor || defaultBranding.primaryColor,
          supportEmail: parsed.supportEmail || defaultBranding.supportEmail,
          websiteUrl: tenant.domain ? `https://${tenant.domain}` : defaultBranding.websiteUrl,
        };
      }
    } catch {
      // Fallback to default
    }

    return defaultBranding;
  }

  public static renderTemplate(
    template: EmailOptions['template'],
    variables: Record<string, any>,
    branding: EmailBranding
  ): { subject: string; html: string; text: string } {
    const primaryColor = branding.primaryColor || '#6366F1';
    const companyName = branding.companyName || 'DAMA-CRM';
    const currentYear = new Date().getFullYear();
    const logoHtml = branding.companyLogo
      ? `<img src="${branding.companyLogo}" alt="${companyName}" style="max-height: 48px; margin-bottom: 12px; display: block;" />`
      : `<div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${companyName}</div>`;

    let subject = variables.subject || `${companyName} Notificación`;
    let mainBody = '';
    let plainText = '';

    switch (template) {
      case '2fa_otp': {
        subject = `🔐 Código de Verificación 2FA: ${variables.otpCode || '000000'} - ${companyName}`;
        mainBody = `
          <div style="text-align: center; padding: 20px 0;">
            <p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
              Hola <strong>${variables.userName || 'Usuario'}</strong>, has solicitado iniciar sesión en <strong>${companyName}</strong>. Introduce este código para confirmar tu identidad:
            </p>
            <div style="display: inline-block; background: #F8FAFC; border: 2px dashed ${primaryColor}; border-radius: 12px; padding: 18px 36px; margin: 15px 0;">
              <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0F172A; font-family: monospace;">${variables.otpCode || '------'}</span>
            </div>
            <p style="font-size: 13px; color: #94A3B8; margin-top: 15px;">
              ⏱️ Este código expirará en <strong>${variables.expiresInMinutes || '5'} minutos</strong>. Si no has sido tú, cambia tu contraseña de inmediato.
            </p>
          </div>
        `;
        plainText = `Tu código de verificación 2FA para ${companyName} es: ${variables.otpCode}. Expira en 5 minutos.`;
        break;
      }

      case 'welcome_invitation': {
        subject = `👋 Bienvenido a ${companyName} - Acceso a tu espacio de trabajo`;
        mainBody = `
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            Hola <strong>${variables.userName || 'Compañero'}</strong>, te damos la bienvenida al espacio de trabajo de <strong>${companyName}</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Se ha creado tu cuenta con el rol <strong>${variables.roleName || 'Miembro'}</strong>. Puedes acceder a la plataforma haciendo clic en el siguiente botón:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.actionUrl || branding.websiteUrl}" style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
              🚀 Entrar a mi Cuenta
            </a>
          </div>
        `;
        plainText = `Bienvenido a ${companyName}. Accede a tu cuenta aquí: ${variables.actionUrl || branding.websiteUrl}`;
        break;
      }

      case 'quote_signature': {
        subject = `✍️ Presupuesto ${variables.quoteNumber || ''} preparado para firma - ${companyName}`;
        mainBody = `
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            Estimado/a <strong>${variables.clientName || 'Cliente'}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Le remitimos la propuesta comercial <strong>${variables.quoteNumber || ''}</strong> por un importe de <strong>${variables.totalAmount || '0.00 €'}</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Puede revisar todos los conceptos y firmar digitalmente el documento en 1 solo clic a través de nuestro portal seguro:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.signatureUrl || variables.actionUrl}" style="background-color: #10B981; color: #ffffff; padding: 14px 32px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
              📑 Ver y Firmar Presupuesto
            </a>
          </div>
        `;
        plainText = `Presupuesto ${variables.quoteNumber} de ${companyName} por ${variables.totalAmount}. Firma aquí: ${variables.signatureUrl || variables.actionUrl}`;
        break;
      }

      case 'invoice_issued': {
        subject = `📑 Factura ${variables.invoiceNumber || ''} emitida por ${companyName}`;
        mainBody = `
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            Hola <strong>${variables.clientName || 'Cliente'}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Adjuntamos el resumen de la factura <strong>${variables.invoiceNumber || ''}</strong> correspondiente a los servicios contratados:
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #64748B;">
              <span>Total Factura:</span>
              <strong style="color: #0F172A; font-size: 16px;">${variables.totalAmount || '0.00 €'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748B;">
              <span>Fecha de Vencimiento:</span>
              <strong style="color: #EF4444;">${variables.dueDate || 'Inmediato'}</strong>
            </div>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${variables.actionUrl || '#'}" style="background-color: ${primaryColor}; color: #ffffff; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
              💳 Ver Factura / Pagar
            </a>
          </div>
        `;
        plainText = `Factura ${variables.invoiceNumber} emitida por ${companyName}. Total: ${variables.totalAmount}. Vencimiento: ${variables.dueDate}`;
        break;
      }

      case 'alert_notification': {
        subject = `⚠️ Alerta del Sistema: ${variables.title || 'Aviso Urgente'} - ${companyName}`;
        mainBody = `
          <div style="border-left: 4px solid #EF4444; padding-left: 16px; margin: 15px 0;">
            <h3 style="color: #0F172A; margin: 0 0 8px 0; font-size: 16px;">${variables.title || 'Alerta Operativa'}</h3>
            <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.5;">${variables.message || 'Se ha registrado un evento crítico que requiere atención.'}</p>
          </div>
          ${variables.actionUrl ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${variables.actionUrl}" style="background-color: #0F172A; color: #ffffff; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
                🔍 Revisar en CRM
              </a>
            </div>
          ` : ''}
        `;
        plainText = `Alerta ${variables.title}: ${variables.message}`;
        break;
      }

      case 'task_assigned': {
        subject = `📋 Nueva tarea asignada: ${variables.taskTitle || 'Tarea'} - ${companyName}`;
        mainBody = `
          <p style="font-size: 15px; color: #334155;">
            Hola <strong>${variables.userName || 'Compañero'}</strong>, se te ha asignado una nueva tarea en <strong>${variables.projectName || 'Proyecto'}</strong>:
          </p>
          <div style="background-color: #F1F5F9; border-radius: 8px; padding: 16px; margin: 15px 0;">
            <h4 style="margin: 0 0 6px 0; color: #0F172A; font-size: 15px;">${variables.taskTitle || ''}</h4>
            <p style="margin: 0; color: #64748B; font-size: 13px;">${variables.taskDescription || 'Sin descripción adicional'}</p>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${variables.actionUrl || '#'}" style="background-color: ${primaryColor}; color: #ffffff; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
              🚀 Abrir en Planificador Ágil
            </a>
          </div>
        `;
        plainText = `Tarea asignada: ${variables.taskTitle} en ${variables.projectName}. Accede: ${variables.actionUrl}`;
        break;
      }

      case 'clockin_reminder': {
        subject = `⏱️ Recordatorio de Fichaje y Registro de Jornada - ${companyName}`;
        mainBody = `
          <p style="font-size: 15px; color: #334155;">
            Hola <strong>${variables.userName || 'Compañero'}</strong>, recuerda registrar tu jornada laboral o pausas reglamentarias de hoy en <strong>Mi Tiempo</strong>.
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${variables.actionUrl || '#'}" style="background-color: #3B82F6; color: #ffffff; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
              ⏱️ Fichar Ahora
            </a>
          </div>
        `;
        plainText = `Recordatorio de fichaje de jornada en ${companyName}. Accede a Mi Tiempo: ${variables.actionUrl}`;
        break;
      }

      default: {
        subject = variables.subject || `${companyName} Notificación`;
        mainBody = `
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">${variables.message || 'Mensaje de notificación del sistema.'}</p>
          ${variables.actionUrl ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${variables.actionUrl}" style="background-color: ${primaryColor}; color: #ffffff; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
                ${variables.actionText || 'Ver en CRM'}
              </a>
            </div>
          ` : ''}
        `;
        plainText = variables.message || 'Notificación DAMA-CRM';
        break;
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1E1B4B 100%); padding: 35px 30px; text-align: center;">
              ${logoHtml}
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px; background-color: #ffffff;">
              ${mainBody}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B; font-weight: 600;">
                © ${currentYear} ${companyName} — Todos los derechos reservados.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8; line-height: 1.5;">
                Mensaje generado automáticamente por la plataforma DAMA-CRM. Conforme al RGPD y la Ley de Servicios de la Sociedad de la Información (LSSI-CE).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { subject, html, text: plainText };
  }

  public static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const branding = await this.getTenantBranding(options.tenantId);
      const { subject, html, text } = this.renderTemplate(options.template, options.variables, branding);

      const fromAddress = process.env.SMTP_FROM || `"${branding.companyName}" <no-reply@damacrm.local>`;
      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject || subject,
        text,
        html,
        attachments: options.attachments,
      });

      console.log(`📧 [EmailService] Email enviado con éxito a ${options.to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`❌ [EmailService] Error enviando email a ${options.to}:`, err);
      return { success: false, error: err.message };
    }
  }
}
