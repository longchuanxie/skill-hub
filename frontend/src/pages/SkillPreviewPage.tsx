import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Layout from '../components/Layout';
import { skillApi } from '../api/market';
import { useAuthStore } from '../stores/authStore';

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  mimeType?: string;
  isBinary?: boolean;
  children?: FileTreeNode[];
}

const SkillPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillName, setSkillName] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFileTree = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await skillApi.getFileTree(id);
        setFileTree(data.fileTree || []);
        
        const skillData = await skillApi.getSkillById(id);
        setSkillName(skillData.name);
      } catch (err) {
        setError('Failed to load file tree');
      } finally {
        setLoading(false);
      }
    };
    fetchFileTree();
  }, [id]);

  const handleFileSelect = async (filePath: string) => {
    if (!id) return;
    setSelectedFile(filePath);
    setContentLoading(true);
    try {
      const data = await skillApi.previewFile(id, filePath);
      setFileContent(data.content || '');
    } catch (err) {
      setError('Failed to load file content');
    } finally {
      setContentLoading(false);
    }
  };

  const toggleDir = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const renderFileTree = (nodes: FileTreeNode[], level: number = 0) => {
    return nodes.map((node, index) => (
      <div key={index} style={{ paddingLeft: `${level * 20}px` }}>
        {node.type === 'directory' ? (
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
            onClick={() => toggleDir(node.path)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {expandedDirs.has(node.path) ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              )}
            </svg>
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm">{node.name}</span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer ${selectedFile === node.path ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            onClick={() => handleFileSelect(node.path)}
          >
            <span className="w-4 h-4"></span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm">{node.name}</span>
            {node.size && (
              <span className="text-xs text-gray-400 ml-auto">
                {(node.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        )}
        {node.type === 'directory' && expandedDirs.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const renderFileContent = () => {
    if (!selectedFile) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Select a file to preview
        </div>
      );
    }

    if (contentLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      );
    }

    const ext = selectedFile.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '');

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Image preview not available</p>
        </div>
      );
    }

    return (
      <pre className="p-4 overflow-auto h-full text-sm bg-gray-50 rounded">
        <code>{fileContent}</code>
      </pre>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-medium">{error}</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/skills')} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Skills
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(`/skills/${id}`)} className="mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Skill
        </Button>

        <Card className="border-2 border-gray-200">
          <CardHeader className="border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <CardTitle className="text-xl text-black">Preview: {skillName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-[70vh]">
              <div className="w-1/3 border-r border-gray-200 overflow-auto">
                <div className="p-4">
                  {fileTree.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No files found
                    </div>
                  ) : (
                    renderFileTree(fileTree)
                  )}
                </div>
              </div>
              <div className="w-2/3 overflow-auto">
                {renderFileContent()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SkillPreviewPage;
