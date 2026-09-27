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
  getTaskDetails,
  addTaskComment,
  listTaskComments,
  deleteTaskComment,
  addTaskWorkLog,
  listTaskWorkLogs,
  deleteTaskWorkLog,
  getMyWorkLogs,
  assignProjectMember,
  removeProjectMember,
  getProjectMembers,
  exportProjectsCSV,
  exportProjectsPDF,
} from './projects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

// Mobile & user specific
router.get('/my-tasks', getMyTasks);
router.get('/my-worklogs', getMyWorkLogs);

// Export
router.get('/export/csv', requirePermission('projects', 'read'), exportProjectsCSV);
router.get('/export/pdf', requirePermission('projects', 'read'), exportProjectsPDF);

// Projects
router.get('/', requirePermission('projects', 'read'), listProjects);
router.get('/:id', requirePermission('projects', 'read'), getProject);
router.post('/', requirePermission('projects', 'create'), createProject);
router.put('/:id', requirePermission('projects', 'update'), updateProject);
router.delete('/:id', requirePermission('projects', 'delete'), deleteProject);
router.post('/:projectId/sprints', requirePermission('projects', 'create'), createSprint);

// Project Members
router.get('/:id/members', requirePermission('projects', 'read'), getProjectMembers);
router.post('/:id/members', requirePermission('projects', 'update'), assignProjectMember);
router.delete('/:id/members/:userId', requirePermission('projects', 'update'), removeProjectMember);

// Tasks Details, Comments & WorkLogs
router.get('/tasks/all', requirePermission('tasks', 'read'), listTasks);
router.get('/tasks/:id', requirePermission('tasks', 'read'), getTaskDetails);
router.post('/tasks', requirePermission('tasks', 'create'), createTask);
router.patch('/tasks/:id', requirePermission('tasks', 'update'), patchTask);
router.put('/tasks/:id', requirePermission('tasks', 'update'), patchTask);
router.delete('/tasks/:id', requirePermission('tasks', 'delete'), deleteTask);

router.get('/tasks/:taskId/comments', requirePermission('tasks', 'read'), listTaskComments);
router.post('/tasks/:taskId/comments', requirePermission('tasks', 'update'), addTaskComment);
router.delete('/tasks/comments/:commentId', requirePermission('tasks', 'update'), deleteTaskComment);

router.get('/tasks/:taskId/worklogs', requirePermission('tasks', 'read'), listTaskWorkLogs);
router.post('/tasks/:taskId/worklogs', requirePermission('tasks', 'update'), addTaskWorkLog);
router.delete('/tasks/worklogs/:workLogId', requirePermission('tasks', 'update'), deleteTaskWorkLog);

export default router;
