import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
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
router.get('/boards', getBoards);
router.get('/boards/:id', getBoardById);
router.post('/boards', createBoard);
router.put('/boards/:id', updateBoard);
router.delete('/boards/:id', deleteBoard);

// Columns
router.post('/columns', createColumn);
router.patch('/columns/:id', updateColumn);
router.delete('/columns/:id', deleteColumn);

// Tasks
router.post('/tasks', createBoardTask);
router.patch('/tasks/:id', updateBoardTask);
router.delete('/tasks/:id', deleteBoardTask);
router.get('/tasks/:taskId/comments', getTaskComments);
router.post('/tasks/:taskId/comments', createTaskComment);
router.delete('/comments/:id', deleteTaskComment);

// Sprints
router.get('/sprints', getSprints);
router.post('/sprints', createSprint);
router.put('/sprints/:id', updateSprint);
router.delete('/sprints/:id', deleteSprint);

// Reminders & Notes
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);

router.get('/notes', getUserNotes);
router.post('/notes', createUserNote);
router.put('/notes/:id', updateUserNote);
router.delete('/notes/:id', deleteUserNote);

// Templates & Changelog
router.get('/templates', getTaskTemplates);
router.post('/templates', createTaskTemplate);
router.delete('/templates/:id', deleteTaskTemplate);

router.get('/releases', getChangelogReleases);
router.post('/releases', createChangelogRelease);

// Odoo ERP Integration for Agile Planner
router.get('/odoo/status', getOdooStatus);
router.post('/odoo/sync', syncOdoo);

export default router;


