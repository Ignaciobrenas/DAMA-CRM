import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createSprint,
  listTasks,
  createTask,
  patchTask,
  deleteTask,
  getMyTasks,
} from './projects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

// Mobile & user specific
router.get('/my-tasks', getMyTasks);

// Projects
router.get('/', requirePermission('projects', 'read'), listProjects);
router.get('/:id', requirePermission('projects', 'read'), getProject);
router.post('/', requirePermission('projects', 'create'), createProject);
router.put('/:id', requirePermission('projects', 'update'), updateProject);
router.delete('/:id', requirePermission('projects', 'delete'), deleteProject);
router.post('/:projectId/sprints', requirePermission('projects', 'create'), createSprint);

// Tasks
router.get('/tasks/all', requirePermission('tasks', 'read'), listTasks);
router.post('/tasks', requirePermission('tasks', 'create'), createTask);
router.patch('/tasks/:id', requirePermission('tasks', 'update'), patchTask);
router.put('/tasks/:id', requirePermission('tasks', 'update'), patchTask);
router.delete('/tasks/:id', requirePermission('tasks', 'delete'), deleteTask);

export default router;
