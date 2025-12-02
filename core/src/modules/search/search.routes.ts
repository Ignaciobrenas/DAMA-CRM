import { Router } from 'express';
import { globalSearch } from './search.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', globalSearch);

export default router;
