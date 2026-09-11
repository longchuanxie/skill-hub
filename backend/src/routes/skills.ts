import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { createSkill, getSkills, getSkillById, updateSkill, deleteSkill, rateSkill, uploadSkillFile, downloadSkill } from '../controllers/SkillController';
import { getSkillFileTree, previewSkillFile } from '../controllers/PreviewController';
import { contentSecurityCheck } from '../middleware/contentSecurity';
import { skillFileUpload } from '../middleware/upload';
import { body } from 'express-validator';

const router = Router();

const validateSkill = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('category').optional().trim(),
];

router.post('/', authenticate, contentSecurityCheck, skillFileUpload, validateSkill, createSkill);
router.post('/upload', authenticate, skillFileUpload, uploadSkillFile);
router.get('/', optionalAuth, getSkills);
router.get('/:id/preview', optionalAuth, previewSkillFile);
router.get('/:id/download', optionalAuth, downloadSkill);
router.get('/:id/file-tree', optionalAuth, getSkillFileTree);
router.put('/:id', authenticate, contentSecurityCheck, skillFileUpload, updateSkill);
router.delete('/:id', authenticate, deleteSkill);
router.post('/:id/rate', authenticate, rateSkill);
router.get('/:id', optionalAuth, getSkillById);

export default router;
