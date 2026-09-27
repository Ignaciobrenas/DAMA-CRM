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

const router = Router();

router.use(authMiddleware);

router.get('/', listFields);
router.post('/', createField);
router.put('/:id', updateField);
router.delete('/:id', deleteField);
router.get('/entity/:entityId', getEntityValues);
router.post('/entity/:entityId', saveEntityValues);

export default router;

