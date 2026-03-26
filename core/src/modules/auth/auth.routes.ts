import { Router } from 'express';
import { login, verify2FA, toggle2FA, getProfile } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema } from '../../utils/validators';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/verify-2fa', verify2FA);
router.post('/toggle-2fa', authMiddleware, toggle2FA);
router.get('/me', authMiddleware, getProfile);

export default router;
