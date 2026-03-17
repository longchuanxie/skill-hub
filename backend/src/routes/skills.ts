import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { createSkill, getSkills, getSkillById, updateSkill, deleteSkill, rateSkill, uploadSkillFile, downloadSkill } from '../controllers/SkillController';
import { contentSecurityCheck } from '../middleware/contentSecurity';
import { skillFileUpload } from '../middleware/upload';
import { body } from 'express-validator';

const router = Router();

const skillValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('category').optional().trim(),
];

router.post('/', authenticate, contentSecurityCheck, skillFileUpload, skillValidation, createSkill);
router.post('/upload', authenticate, skillFileUpload, uploadSkillFile);
router.get('/', optionalAuth, getSkills);
router.get('/:id/download', optionalAuth, downloadSkill);
router.get('/:id', optionalAuth, getSkillById);
router.put('/:id', authenticate, updateSkill);
router.delete('/:id', authenticate, deleteSkill);
router.post('/:id/rate', authenticate, rateSkill);

export default router;
