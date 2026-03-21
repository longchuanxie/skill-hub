import { useState, useEffect } from 'react';
import { onlineTestApi, TestCase } from '../api/onlineTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TestCaseListProps {
  skillId: string;
  onEditTestCase?: (testCase: TestCase) => void;
  onDeleteTestCase?: (testCaseId: string) => void;
  onRunTest?: () => void;
}

const TestCaseList: React.FC<TestCaseListProps> = ({
  skillId,
  onEditTestCase,
  onDeleteTestCase,
  onRunTest
}) => {
  const { t } = useTranslation();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestCases = async () => {
      try {
        const data = await onlineTestApi.getTestCases(skillId);
        setTestCases(data);
      } catch (error) {
        console.error('Failed to fetch test cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [skillId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (testCases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>{t('test.noTestCases')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('test.testCases')}</CardTitle>
        {onRunTest && (
          <Button onClick={onRunTest} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            {t('test.runAll')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {testCases.map((testCase) => (
            <div
              key={testCase._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <h4 className="font-medium">{testCase.name}</h4>
                {testCase.description && (
                  <p className="text-sm text-gray-600 mt-1">{testCase.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {t('test.timeout')}: {testCase.timeout / 1000}s
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {onEditTestCase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTestCase(testCase)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDeleteTestCase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteTestCase(testCase._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCaseList;
