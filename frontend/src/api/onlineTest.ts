import { apiClient } from './client';

export interface TestCase {
  _id: string;
  skillId: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  timeout: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseResult {
  testCaseId: string;
  testCaseName: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  actualOutput?: any;
  errorMessage?: string;
  duration: number;
}

export interface TestLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  data?: any;
}

export interface TestResult {
  _id: string;
  skillId: string;
  version: string;
  status: 'running' | 'passed' | 'failed' | 'error';
  startTime: string;
  endTime?: string;
  duration?: number;
  results: TestCaseResult[];
  logs: TestLog[];
  createdBy: string;
  createdAt: string;
}

export interface CreateTestCaseRequest {
  name: string;
  description?: string;
  input: any;
  expectedOutput: any;
  timeout?: number;
}

export interface UpdateTestCaseRequest {
  name?: string;
  description?: string;
  input?: any;
  expectedOutput?: any;
  timeout?: number;
}

export const onlineTestApi = {
  createTestCase: async (skillId: string, data: CreateTestCaseRequest): Promise<TestCase> => {
    const response = await apiClient.post(`/test/skills/${skillId}/test-cases`, data);
    return response.data.data;
  },

  getTestCases: async (skillId: string): Promise<TestCase[]> => {
    const response = await apiClient.get(`/test/skills/${skillId}/test-cases`);
    return response.data.data;
  },

  updateTestCase: async (skillId: string, testCaseId: string, data: UpdateTestCaseRequest): Promise<TestCase> => {
    const response = await apiClient.put(`/test/skills/${skillId}/test-cases/${testCaseId}`, data);
    return response.data.data;
  },

  deleteTestCase: async (skillId: string, testCaseId: string): Promise<void> => {
    await apiClient.delete(`/test/skills/${skillId}/test-cases/${testCaseId}`);
  },

  executeTest: async (skillId: string): Promise<TestResult> => {
    const response = await apiClient.post(`/test/skills/${skillId}/test`);
    return response.data.data;
  },

  getTestResult: async (skillId: string, testResultId: string): Promise<TestResult> => {
    const response = await apiClient.get(`/test/skills/${skillId}/test-results/${testResultId}`);
    return response.data.data;
  },

  getTestLogs: async (skillId: string, testResultId: string): Promise<TestLog[]> => {
    const response = await apiClient.get(`/test/skills/${skillId}/test-results/${testResultId}/logs`);
    return response.data.data;
  }
};
