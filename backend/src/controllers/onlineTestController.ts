import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TestCase } from '../models/TestCase';
import { TestResult } from '../models/TestResult';
import { Skill } from '../models/Skill';

export const createTestCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { name, description, input, expectedOutput, timeout } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to create test case'
      });
      return;
    }

    const testCase = new TestCase({
      skillId,
      name,
      description,
      input,
      expectedOutput,
      timeout: timeout || 30000,
      createdBy: req.user.userId
    });

    await testCase.save();

    res.status(201).json({
      success: true,
      data: testCase
    });
  } catch (error) {
    console.error('Create test case error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test case'
    });
  }
};

export const getTestCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    const hasAccess =
      skill.visibility === 'public' ||
      (req.user?.userId && String(skill.owner) === req.user.userId);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const testCases = await TestCase.find({ skillId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: testCases
    });
  } catch (error) {
    console.error('Get test cases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test cases'
    });
  }
};

export const updateTestCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, testCaseId } = req.params;
    const updates = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      res.status(404).json({
        success: false,
        error: 'Test case not found'
      });
      return;
    }

    if (String(testCase.skillId) !== skillId) {
      res.status(400).json({
        success: false,
        error: 'Test case does not belong to this skill'
      });
      return;
    }

    if (String(testCase.createdBy) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update test case'
      });
      return;
    }

    Object.assign(testCase, updates);
    await testCase.save();

    res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    console.error('Update test case error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test case'
    });
  }
};

export const deleteTestCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, testCaseId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      res.status(404).json({
        success: false,
        error: 'Test case not found'
      });
      return;
    }

    if (String(testCase.skillId) !== skillId) {
      res.status(400).json({
        success: false,
        error: 'Test case does not belong to this skill'
      });
      return;
    }

    if (String(testCase.createdBy) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete test case'
      });
      return;
    }

    await testCase.deleteOne();

    res.json({
      success: true,
      message: 'Test case deleted'
    });
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test case'
    });
  }
};

export const executeTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    const hasAccess =
      skill.visibility === 'public' ||
      String(skill.owner) === req.user.userId;

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const testCases = await TestCase.find({ skillId });

    const testResult = new TestResult({
      skillId,
      version: skill.version,
      createdBy: req.user.userId
    });

    await testResult.save();

    res.status(202).json({
      success: true,
      data: testResult,
      message: 'Test execution started'
    });
  } catch (error) {
    console.error('Execute test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute test'
    });
  }
};

export const getTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, testResultId } = req.params;

    const testResult = await TestResult.findById(testResultId);
    if (!testResult) {
      res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
      return;
    }

    if (String(testResult.skillId) !== skillId) {
      res.status(400).json({
        success: false,
        error: 'Test result does not belong to this skill'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    const hasAccess =
      skill?.visibility === 'public' ||
      (req.user?.userId && String(testResult.createdBy) === req.user.userId);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Get test result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test result'
    });
  }
};

export const getTestLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, testResultId } = req.params;

    const testResult = await TestResult.findById(testResultId);
    if (!testResult) {
      res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
      return;
    }

    if (String(testResult.skillId) !== skillId) {
      res.status(400).json({
        success: false,
        error: 'Test result does not belong to this skill'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    const hasAccess =
      skill?.visibility === 'public' ||
      (req.user?.userId && String(testResult.createdBy) === req.user.userId);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: testResult.logs
    });
  } catch (error) {
    console.error('Get test logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test logs'
    });
  }
};
