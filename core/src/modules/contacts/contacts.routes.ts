import { Router } from 'express';
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from './contacts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('contacts', 'read'), listContacts);
router.get('/:id', requirePermission('contacts', 'read'), getContact);
router.post('/', requirePermission('contacts', 'create'), createContact);
router.put('/:id', requirePermission('contacts', 'update'), updateContact);
router.delete('/:id', requirePermission('contacts', 'delete'), deleteContact);

export default router;
