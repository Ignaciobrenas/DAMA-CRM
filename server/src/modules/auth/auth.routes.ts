import { Router } from 'express';
import {
  login,
  register,
  verify2FA,
  toggle2FA,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
} from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema } from '../../utils/validators';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', register);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);
router.post('/toggle-2fa', authMiddleware, toggle2FA);
router.get('/me', authMiddleware, getProfile);

export default router;
