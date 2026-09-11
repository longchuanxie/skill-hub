import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createAgent, getAgents, getAgentById, updateAgent, deleteAgent, regenerateAgentKey, getAgentApiKey } from '../controllers/agentController';

const router = Router();

router.post('/', authenticate, createAgent);
router.get('/', authenticate, getAgents);
router.get('/:id', authenticate, getAgentById);
router.put('/:id', authenticate, updateAgent);
router.delete('/:id', authenticate, deleteAgent);
router.post('/:id/regenerate-key', authenticate, regenerateAgentKey);
router.get('/:id/api-key', authenticate, getAgentApiKey);

export default router;
