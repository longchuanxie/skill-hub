import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { adminApi, AuditLogItem } from '../api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Heading } from '@/components/typography/Heading';

const PAGE_SIZE = 20;

const AdminAuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAuditLogs({
        page,
        pageSize: PAGE_SIZE,
        action: actionFilter || undefined,
      });
      setLogs(data.logs);
      setTotalPages(Math.max(1, data.pagination.pages));
    } catch {
      setError(t('admin.auditLogs.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Heading level={1}>{t('admin.auditLogs.title')}</Heading>
        <p className="text-muted-foreground mt-1 mb-6">{t('admin.auditLogs.subtitle')}</p>

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder={t('admin.auditLogs.filterAction')}
            value={actionFilter}
            onChange={(e) => {
              setPage(1);
              setActionFilter(e.target.value.trim());
            }}
            className="max-w-xs"
          />
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">{t('admin.auditLogs.empty')}</p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.auditLogs.time')}</TableHead>
                  <TableHead>{t('admin.auditLogs.action')}</TableHead>
                  <TableHead>{t('admin.auditLogs.actor')}</TableHead>
                  <TableHead>{t('admin.auditLogs.target')}</TableHead>
                  <TableHead>{t('admin.auditLogs.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-sm">
                      {log.actor?.username || log.actor?._id || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.targetType ? `${log.targetType}` : '-'}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('admin.auditLogs.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {t('admin.auditLogs.next')}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAuditLogsPage;
