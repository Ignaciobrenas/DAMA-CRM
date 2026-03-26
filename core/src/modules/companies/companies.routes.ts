import { Router } from 'express';
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from './companies.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCompanySchema } from '../../utils/validators';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('companies', 'read'), listCompanies);
router.get('/:id', requirePermission('companies', 'read'), getCompany);
router.post('/', requirePermission('companies', 'create'), validate(createCompanySchema), createCompany);
router.put('/:id', requirePermission('companies', 'update'), updateCompany);
router.delete('/:id', requirePermission('companies', 'delete'), deleteCompany);

export default router;
