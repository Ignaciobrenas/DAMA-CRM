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
import { rateLimiter } from '../../middlewares/rate-limit.middleware';
import { loginSchema } from '../../utils/validators';

const router = Router();

// Brute-force protection: 15 attempts per 15 minutes for login
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de inicio de sesión. Por favor, espere 15 minutos antes de volver a intentarlo.',
});

// Brute-force protection: 5 attempts per 15 minutes for 2FA / Passwords
const sensitiveAuthLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Límite de solicitudes de verificación excedido. Inténtelo más tarde.',
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/register', register);
router.post('/verify-2fa', sensitiveAuthLimiter, verify2FA);
router.post('/forgot-password', sensitiveAuthLimiter, forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, resetPassword);
router.post('/change-password', authMiddleware, changePassword);
router.post('/toggle-2fa', authMiddleware, toggle2FA);
router.get('/me', authMiddleware, getProfile);

export default router;
