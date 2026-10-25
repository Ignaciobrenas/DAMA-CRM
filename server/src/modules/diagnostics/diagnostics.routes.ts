import { Router } from 'express';
import { DiagnosticsController } from './diagnostics.controller';

const router = Router();

// HTML Dashboard views (at root / and /dashboard)
router.get('/', DiagnosticsController.getDashboardHtml);
router.get('/dashboard', DiagnosticsController.getDashboardHtml);

// Realtime Telemetry APIs
router.get('/status', DiagnosticsController.getTelemetry);
router.get('/api/status', DiagnosticsController.getTelemetry);

// Interactive test bench endpoints
router.get('/api/diagnostics/endpoints', DiagnosticsController.getEndpointsCatalog);
router.post('/api/diagnostics/quick-token', DiagnosticsController.getQuickToken);

export default router;
