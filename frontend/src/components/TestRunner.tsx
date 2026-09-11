import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { onlineTestApi, TestCase, TestResult } from '../api/onlineTest';
import { toast } from 'sonner';

interface TestRunnerProps {
  skillId: string;
  testCases: TestCase[];
  onTestComplete?: (results: TestResult[]) => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ skillId, testCases, onTestComplete }) => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState<number>(-1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default">{t('onlineTest.statusPassed')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('onlineTest.statusFailed')}</Badge>;
      case 'error':
        return <Badge variant="outline">{t('onlineTest.statusError')}</Badge>;
      case 'timeout':
        return <Badge variant="secondary">{t('onlineTest.statusTimeout')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('onlineTest.testRunner')}</span>
            <Button disabled={isRunning || testCases.length === 0}>
              {isRunning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('onlineTest.running')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('onlineTest.runAllTests')}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('onlineTest.noTestCases')}
            </div>
          ) : (
            <div className="space-y-4">
              {results.length > 0 && (
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t('onlineTest.total')}:</span>
                    <span className="text-sm">{results.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">{t('onlineTest.passed')}:</span>
                    <span className="text-sm text-green-600">{passedCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-600">{t('onlineTest.failed')}:</span>
                    <span className="text-sm text-red-600">{failedCount}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {testCases.map((testCase, index) => {
                  const result = results.find(r => r.testCaseId === testCase._id);
                  const isCurrentTest = currentTestCaseIndex === index;
                  
                  return (
                    <Card key={testCase._id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{testCase.name}</h4>
                            <p className="text-sm text-gray-500">{testCase.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {isCurrentTest && <LoadingSpinner size="sm" />}
                            {result && getStatusBadge(result.status)}
                            <Button size="sm" disabled={isRunning}>
                              {t('onlineTest.runTest')}
                            </Button>
                          </div>
                        </div>
                        
                        {result && result.logs && result.logs.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
                              {result.logs.map((log, i) => (
                                <div key={i} className="mb-1">
                                  <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRunner;
