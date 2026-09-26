import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
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
import notificationsRoutes from './modules/notifications/notifications.routes';
import employeesRoutes from './modules/employees/employees.routes';
import modulesRoutes from './modules/modules/modules.routes';

const app = express();

// Global Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic Multi-Tenant CORS Configuration
const allowedOriginPatterns = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.damacrm\.com$/,
  /\.damacrm\.local$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed || config.env === 'development') {
        callback(null, true);
      } else {
        callback(null, true); // Fallback permissive for self-hosted domain flexibility
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

// Interactive Swagger OpenAPI Documentation (Zero extra dependencies)
app.get('/api/docs/json', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'docs', 'swagger.json'));
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

// Register API Modules
app.use('/api/auth', authRoutes);
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
app.use('/api/expenses', expensesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/modules', modulesRoutes);

// Explicit third-party integrations catalog endpoint
import { getIntegracionesDeTerceros } from './modules/integrations/integrations.controller';
app.get('/api/integraciones-de-terceros', getIntegracionesDeTerceros);

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
