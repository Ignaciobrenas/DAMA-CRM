import dotenv from 'dotenv';
import path from 'path';

// Load from core/.env first, then current working directory and project root
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
dotenv.config({ override: true });


export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_crm_dama_change_me_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    tempExpiresIn: '10m', // For 2FA OTP verification
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://crm_user:crm_password@localhost:5433/dama_crm?schema=public',
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
  integrations: {
    odoo: {
      url: process.env.ODOO_URL || '',
      db: process.env.ODOO_DB || '',
      username: process.env.ODOO_USERNAME || '',
      apiKey: process.env.ODOO_API_KEY || '',
    },
    woocommerce: {
      storeUrl: process.env.WOOCOMMERCE_STORE_URL || '',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
      webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET || '',
    },
    shopify: {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY || '',
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    },
    n8n: {
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      apiKey: process.env.N8N_API_KEY || '',
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    zapier: {
      webhookUrl: process.env.ZAPIER_WEBHOOK_URL || '',
      apiKey: process.env.ZAPIER_API_KEY || '',
    },
    googleCalendar: {
      email: process.env.GOOGLE_CALENDAR_EMAIL || '',
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
    },
    whatsapp: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    },
  },
};
