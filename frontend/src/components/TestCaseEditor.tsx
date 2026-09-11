import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from '../api/onlineTest';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';

interface TestCaseEditorProps {
  skillId: string;
  testCase?: TestCase;
  onSave: (data: CreateTestCaseRequest | UpdateTestCaseRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  skillId,
  testCase,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTestCaseRequest>({
    defaultValues: testCase ? {
      name: testCase.name,
      description: testCase.description,
      input: typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input, null, 2),
      expectedOutput: typeof testCase.expectedOutput === 'string' ? testCase.expectedOutput : JSON.stringify(testCase.expectedOutput, null, 2),
      timeout: testCase.timeout
    } : {
      timeout: 30000
    }
  });

  const [inputJson, setInputJson] = useState(
    testCase ? (typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input, null, 2)) : '{\n  \n}'
  );
  const [expectedOutputJson, setExpectedOutputJson] = useState(
    testCase ? (typeof testCase.expectedOutput === 'string' ? testCase.expectedOutput : JSON.stringify(testCase.expectedOutput, null, 2)) : '{\n  \n}'
  );

  const onSubmit = (data: CreateTestCaseRequest) => {
    try {
      const parsedInput = JSON.parse(inputJson);
      const parsedExpectedOutput = JSON.parse(expectedOutputJson);
      
      onSave({
        ...data,
        input: parsedInput,
        expectedOutput: parsedExpectedOutput
      });
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {testCase ? t('test.editTestCase') : t('test.createTestCase')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('test.testCaseName')}</Label>
            <Input
              id="name"
              {...register('name', { required: t('test.nameRequired') })}
              placeholder={t('test.testCaseNamePlaceholder')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('test.description')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('test.descriptionPlaceholder')}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">{t('test.input')}</Label>
            <Textarea
              id="input"
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder={t('test.inputPlaceholder')}
              rows={8}
              className="font-mono text-sm"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">{t('test.inputHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedOutput">{t('test.expectedOutput')}</Label>
            <Textarea
              id="expectedOutput"
              value={expectedOutputJson}
              onChange={(e) => setExpectedOutputJson(e.target.value)}
              placeholder={t('test.expectedOutputPlaceholder')}
              rows={8}
              className="font-mono text-sm"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">{t('test.expectedOutputHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout">{t('test.timeout')} (ms)</Label>
            <Input
              id="timeout"
              type="number"
              {...register('timeout', { 
                min: { value: 1000, message: t('test.timeoutMin') },
                max: { value: 300000, message: t('test.timeoutMax') }
              })}
              placeholder="30000"
              disabled={isLoading}
            />
            {errors.timeout && (
              <p className="text-sm text-red-600">{errors.timeout.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TestCaseEditor;
