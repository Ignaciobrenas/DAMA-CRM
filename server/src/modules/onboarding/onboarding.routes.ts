import { Router } from 'express';
import {
  createInvitation,
  verifyInvitationToken,
  checkSlugAvailability,
  completeOnboarding,
} from './onboarding.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Public onboarding verification and submission
router.get('/verify-token', verifyInvitationToken);
router.get('/check-slug', checkSlugAvailability);
router.post('/complete', completeOnboarding);

// Protected God/Admin invitation creation
router.post('/invite', authMiddleware, createInvitation);

export default router;
