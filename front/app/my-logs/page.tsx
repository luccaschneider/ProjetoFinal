'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { logApi } from '@/lib/api';
import { UserLogDTO, PageResponse } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<PageResponse<UserLogDTO> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('');

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await logApi.listMyLogs(page, 20, actionFilter || undefined);
      setLogs(data);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session) {
      loadLogs();
    }
  }, [status, session, router, loadLogs]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('LOGIN') || action.includes('REGISTER')) return 'default';
    if (action.includes('INSCRIPTION')) return 'secondary';
    if (action.includes('CERTIFICATE')) return 'outline';
    if (action.includes('ATTENDANCE') || action.includes('QUICK')) return 'default';
    return 'secondary';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: 'Login',
      REGISTER: 'Cadastro',
      EVENT_INSCRIPTION: 'Inscrição em Evento',
      EVENT_UNINSCRIPTION: 'Cancelamento de Inscrição',
      CERTIFICATE_GENERATE: 'Geração de Certificado',
      CERTIFICATE_DOWNLOAD: 'Download de Certificado',
      ATTENDANCE_REGISTER: 'Registro de Presença',
      QUICK_REGISTER: 'Cadastro Rápido',
    };
    return labels[action] || action;
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">Carregando...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Histórico de todas as suas ações no sistema
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <CardDescription>
              Total: {logs?.totalElements || 0} ações registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Todas as ações</option>
                <option value="LOGIN">Login</option>
                <option value="REGISTER">Cadastro</option>
                <option value="EVENT_INSCRIPTION">Inscrição</option>
                <option value="EVENT_UNINSCRIPTION">Cancelamento</option>
                <option value="CERTIFICATE_GENERATE">Geração de Certificado</option>
                <option value="CERTIFICATE_DOWNLOAD">Download de Certificado</option>
                <option value="ATTENDANCE_REGISTER">Registro de Presença</option>
                <option value="QUICK_REGISTER">Cadastro Rápido</option>
              </select>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo de Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.content.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {logs && logs.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page + 1} de {logs.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(logs.totalPages - 1, p + 1))}
                    disabled={page >= logs.totalPages - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {logs?.content.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum log encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

