import { Router } from 'express';
import {
  listFields,
  createField,
  updateField,
  deleteField,
  getEntityValues,
  saveEntityValues,
} from './custom-fields.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listFields);
router.post('/', requirePermission('settings', 'create'), createField);
router.put('/:id', requirePermission('settings', 'update'), updateField);
router.delete('/:id', requirePermission('settings', 'delete'), deleteField);
router.get('/entity/:entityId', getEntityValues);
router.post('/entity/:entityId', saveEntityValues);

export default router;

