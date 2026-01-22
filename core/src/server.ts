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
