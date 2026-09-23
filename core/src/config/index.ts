import dotenv from 'dotenv';
import path from 'path';

// Load from current working directory, then check parent directory (project root)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_crm_dama_change_me_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    tempExpiresIn: '10m', // For 2FA OTP verification
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://crm_user:crm_password@localhost:5432/dama_crm?schema=public',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'notificaciones@tudominio.com',
    pass: process.env.SMTP_PASS || 'secret',
    from: process.env.SMTP_FROM || 'DAMA-CRM <no-reply@tudominio.com>',
  },
  webhooks: {
    unopimSecret: process.env.UNOPIM_WEBHOOK_SECRET || 'unopim_secret_token_123',
    whatsappVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'meta_verify_token_crm_456',
  },
};
