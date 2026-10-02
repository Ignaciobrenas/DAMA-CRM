import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
import { globalLimiter, authLimiter } from './middlewares/rate-limit.middleware';
import { wsService } from './services/websocket.service';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import companiesRoutes from './modules/companies/companies.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
import dealsRoutes from './modules/deals/deals.routes';
import projectsRoutes from './modules/projects/projects.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import workflowsRoutes from './modules/workflows/workflows.routes';
import omnichannelRoutes from './modules/omnichannel/omnichannel.routes';
import searchRoutes from './modules/search/search.routes';
import reportsRoutes from './modules/reports/reports.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import customFieldsRoutes from './modules/custom-fields/custom-fields.routes';
import leadCaptureRoutes from './modules/lead-capture/lead-capture.routes';
import brandingRoutes from './modules/branding/branding.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import godRoutes from './modules/god/god.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import plannerRoutes from './modules/planner/planner.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import employeesRoutes from './modules/employees/employees.routes';
import modulesRoutes from './modules/modules/modules.routes';
import contractsRoutes from './modules/contracts/contracts.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import logisticsRoutes from './modules/logistics/logistics.routes';

const app = express();

app.set('trust proxy', 1);

// Global Middlewares & TLS/HSTS Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

// Dynamic Multi-Tenant CORS Configuration
const allowedOriginPatterns = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.damacrm\.com$/,
  /\.damacrm\.local$/,
  /\.dama\.com$/,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?dama\.com(:\d+)?$/,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?damacrm\.local(:\d+)?$/,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?localhost(:\d+)?$/,
];

const customOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isPatternAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));
      const isCustomAllowed = customOrigins.includes(origin);
      if (isPatternAllowed || isCustomAllowed || config.env === 'development') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-unopim-secret',
      'X-Tenant-ID',
      'X-Tenant-Slug',
      'X-Switch-Tenant-ID',
    ],
    exposedHeaders: ['Content-Disposition', 'X-Tenant-ID'],
    maxAge: 86400,
  })
);

app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck endpoint for Docker & Traefik
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dama-crm-core',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/docs/json', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const candidates = [
    path.join(__dirname, 'docs', 'swagger.json'),
    path.join(__dirname, '..', 'src', 'docs', 'swagger.json'),
    path.join(process.cwd(), 'src', 'docs', 'swagger.json'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    res.sendFile(found);
  } else {
    res.json({ openapi: '3.0.3', info: { title: 'DAMA-CRM API', version: '1.0.0' } });
  }
});

app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>DAMA-CRM API Docs (Swagger UI)</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #fafafa; }
        .topbar { display: none !important; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/docs/json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Register API Modules with Rate Limiting
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/omnichannel', omnichannelRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/custom-fields', customFieldsRoutes);
app.use('/api/lead-capture', leadCaptureRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/god', godRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/logistics', logisticsRoutes);

// Explicit third-party integrations catalog endpoint
import { getIntegracionesDeTerceros } from './modules/integrations/integrations.controller';
app.get('/api/integraciones-de-terceros', getIntegracionesDeTerceros);

  app.post('/api/logs/client-error', async (req, res, next) => { try { const { message, stack, route, userAgent } = req.body; const safeHeaders = { ...req.headers }; delete safeHeaders['authorization']; const { prisma } = require('./prisma'); await prisma.systemErrorLog.create({ data: { statusCode: 500, message: '[Frontend Crash] ' + (message || 'Unknown client error'), stack: stack, method: 'CLIENT', path: route || '/', userId: req.user?.userId || null, ipAddress: req.ip || req.socket?.remoteAddress || null, headers: JSON.stringify(safeHeaders), body: JSON.stringify({ userAgent }) } }); res.status(200).json({ success: true }); } catch (error) { next(error); } });

  // Centralized error handler
app.use(errorHandler);

const server = http.createServer(app);
wsService.init(server);

// Start HTTP & WebSocket listener
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`
  🚀 DAMA-CRM Core API running on port ${config.port} [${config.env}]
  📡 Healthcheck: http://localhost:${config.port}/api/health
  ⚡ WebSockets: ws://localhost:${config.port}/ws
  🔒 Security: JWT + Dynamic RBAC + Multi-Tenant God Mode + 2FA Enabled
  🏢 Tenants & God Mode: http://localhost:${config.port}/api/god/tenants
  🎫 Helpdesk Tickets: http://localhost:${config.port}/api/tickets
  💸 Expenses & P&L: http://localhost:${config.port}/api/expenses
  📦 Inventory UnoPIM Webhook: http://localhost:${config.port}/api/inventory/webhooks/unopim
  💬 WhatsApp Meta Webhook: http://localhost:${config.port}/api/omnichannel/webhooks/whatsapp
  🛍️ WooCommerce Webhook: http://localhost:${config.port}/api/integrations/woocommerce/webhook
  🛒 Shopify Webhook: http://localhost:${config.port}/api/integrations/shopify/webhook
  ⚡ n8n Webhook / Action: http://localhost:${config.port}/api/integrations/n8n/action
    `);
  });
}

export { server };
export default app;

