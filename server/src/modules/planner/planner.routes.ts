import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createBoardTask,
  updateBoardTask,
  deleteBoardTask,
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  getTaskComments,
  createTaskComment,
  deleteTaskComment,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getUserNotes,
  createUserNote,
  updateUserNote,
  deleteUserNote,
  getTaskTemplates,
  createTaskTemplate,
  deleteTaskTemplate,
  getChangelogReleases,
  createChangelogRelease,
  getOdooStatus,
  syncOdoo,
} from './planner.controller';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Boards
router.get('/boards', requirePermission('projects', 'read'), getBoards);
router.get('/boards/:id', requirePermission('projects', 'read'), getBoardById);
router.post('/boards', requirePermission('projects', 'create'), createBoard);
router.put('/boards/:id', requirePermission('projects', 'update'), updateBoard);
router.delete('/boards/:id', requirePermission('projects', 'delete'), deleteBoard);

// Columns
router.post('/columns', requirePermission('tasks', 'update'), createColumn);
router.patch('/columns/:id', requirePermission('tasks', 'update'), updateColumn);
router.delete('/columns/:id', requirePermission('tasks', 'delete'), deleteColumn);

// Tasks
router.post('/tasks', requirePermission('tasks', 'create'), createBoardTask);
router.patch('/tasks/:id', requirePermission('tasks', 'update'), updateBoardTask);
router.delete('/tasks/:id', requirePermission('tasks', 'delete'), deleteBoardTask);
router.get('/tasks/:taskId/comments', requirePermission('tasks', 'read'), getTaskComments);
router.post('/tasks/:taskId/comments', requirePermission('tasks', 'update'), createTaskComment);
router.delete('/comments/:id', requirePermission('tasks', 'delete'), deleteTaskComment);

// Sprints
router.get('/sprints', requirePermission('projects', 'read'), getSprints);
router.post('/sprints', requirePermission('projects', 'create'), createSprint);
router.put('/sprints/:id', requirePermission('projects', 'update'), updateSprint);
router.delete('/sprints/:id', requirePermission('projects', 'delete'), deleteSprint);

// Reminders & Notes (Personal user items)
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);

router.get('/notes', getUserNotes);
router.post('/notes', createUserNote);
router.put('/notes/:id', updateUserNote);
router.delete('/notes/:id', deleteUserNote);

// Templates & Changelog
router.get('/templates', requirePermission('projects', 'read'), getTaskTemplates);
router.post('/templates', requirePermission('projects', 'create'), createTaskTemplate);
router.delete('/templates/:id', requirePermission('projects', 'delete'), deleteTaskTemplate);

router.get('/releases', requirePermission('projects', 'read'), getChangelogReleases);
router.post('/releases', requirePermission('projects', 'create'), createChangelogRelease);

// Odoo ERP Integration for Agile Planner
router.get('/odoo/status', requirePermission('projects', 'manage'), getOdooStatus);
router.post('/odoo/sync', requirePermission('projects', 'manage'), syncOdoo);

export default router;


