import express from 'express';
import { testHome } from '../controllers/testController';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createTestCase,
  getTestCases,
  updateTestCase,
  deleteTestCase,
  executeTest,
  getTestResult,
  getTestLogs
} from '../controllers/onlineTestController';

const router = express.Router();

router.get('/test', testHome);

router.post('/skills/:skillId/test-cases', authenticate, createTestCase);
router.get('/skills/:skillId/test-cases', optionalAuth, getTestCases);
router.put('/skills/:skillId/test-cases/:testCaseId', authenticate, updateTestCase);
router.delete('/skills/:skillId/test-cases/:testCaseId', authenticate, deleteTestCase);
router.post('/skills/:skillId/test', authenticate, executeTest);
router.get('/skills/:skillId/test-results/:testResultId', optionalAuth, getTestResult);
router.get('/skills/:skillId/test-results/:testResultId/logs', optionalAuth, getTestLogs);

export default router;