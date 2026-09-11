import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '../components/Layout';
import TestCaseList from '../components/TestCaseList';
import TestCaseEditor from '../components/TestCaseEditor';
import TestRunner from '../components/TestRunner';
import { onlineTestApi, TestCase } from '../api/onlineTest';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const SkillOnlineTestPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  useEffect(() => {
    loadTestCases();
  }, [id]);

  const loadTestCases = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await onlineTestApi.getTestCases(id);
      setTestCases(data);
    } catch (error) {
      console.error('Failed to load test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = () => {
    setEditingTestCase(null);
    setShowEditor(true);
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setShowEditor(true);
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!window.confirm(t('onlineTest.deleteConfirm'))) return;
    
    try {
      await onlineTestApi.deleteTestCase(testCaseId);
      await loadTestCases();
    } catch (error) {
      console.error('Failed to delete test case:', error);
    }
  };

  const handleTestCaseSaved = () => {
    setShowEditor(false);
    setEditingTestCase(null);
    loadTestCases();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(`/skills/${id}`)} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('common.back')}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h1 className="text-3xl font-bold text-black">{t('onlineTest.title')}</h1>
        </div>

        {showEditor ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTestCase ? t('onlineTest.editTestCase') : t('onlineTest.createTestCase')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestCaseEditor
                skillId={id!}
                testCase={editingTestCase}
                onSaved={handleTestCaseSaved}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingTestCase(null);
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="testCases" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="testCases">{t('onlineTest.testCases')}</TabsTrigger>
              <TabsTrigger value="testRunner">{t('onlineTest.testRunner')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="testCases">
              <TestCaseList
                testCases={testCases}
                onAddTestCase={handleCreateTestCase}
                onEditTestCase={handleEditTestCase}
                onDeleteTestCase={handleDeleteTestCase}
              />
            </TabsContent>
            
            <TabsContent value="testRunner">
              <TestRunner
                skillId={id!}
                testCases={testCases}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default SkillOnlineTestPage;
