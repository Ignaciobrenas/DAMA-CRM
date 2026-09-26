import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { getCompanyModules, updateCompanyModules } from './modules.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getCompanyModules);
router.patch('/', updateCompanyModules);

export default router;
