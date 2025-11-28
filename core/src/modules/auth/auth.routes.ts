import { Router } from 'express';
import { login, verify2FA, toggle2FA, getProfile } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/toggle-2fa', authMiddleware, toggle2FA);
router.get('/me', authMiddleware, getProfile);

export default router;
