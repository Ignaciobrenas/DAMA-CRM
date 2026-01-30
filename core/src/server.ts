import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';

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

const app = express();

// Global Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*', // In production, can be restricted to DOMAIN_NAME
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-unopim-secret'],
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

// Centralized error handler
app.use(errorHandler);

// Start HTTP listener
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`
  🚀 DAMA-CRM Core API running on port ${config.port} [${config.env}]
  📡 Healthcheck: http://localhost:${config.port}/api/health
  🔒 Security: JWT + Dynamic RBAC + 2FA Enabled
  📦 Inventory UnoPIM Webhook: http://localhost:${config.port}/api/inventory/webhooks/unopim
  💬 WhatsApp Meta Webhook: http://localhost:${config.port}/api/omnichannel/webhooks/whatsapp
    `);
  });
}

export default app;
