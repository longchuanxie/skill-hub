import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { createPrompt, getPrompts, getPromptById, updatePrompt, deletePrompt, ratePrompt, renderPrompt, copyPrompt, rollbackPrompt, compareVersions } from '../controllers/PromptController';
import { contentSecurityCheck } from '../middleware/contentSecurity';
import { body } from 'express-validator';

const router = Router();

const promptValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('content').trim().notEmpty().withMessage('Content required'),
];

router.post('/', authenticate, contentSecurityCheck, promptValidation, createPrompt);
router.get('/', optionalAuth, getPrompts);
router.get('/:id', optionalAuth, getPromptById);
router.put('/:id', authenticate, updatePrompt);
router.delete('/:id', authenticate, deletePrompt);
router.post('/:id/rate', authenticate, ratePrompt);
router.post('/:id/render', authenticate, renderPrompt);
router.post('/:id/copy', authenticate, copyPrompt);
router.post('/:id/rollback/:version', authenticate, rollbackPrompt);
router.get('/:id/compare', optionalAuth, compareVersions);

export default router;
