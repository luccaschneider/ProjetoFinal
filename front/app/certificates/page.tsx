'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { inscriptionApi, certificateApi } from '@/lib/api';
import { EventResponseDTO } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Download, FileText, LogIn, Info } from 'lucide-react';

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadEvents = useCallback(async () => {
    if (hasLoadedRef.current || !session) return;
    try {
      setIsLoading(true);
      hasLoadedRef.current = true;
      const data = await inscriptionApi.listarPresencas();
      setEvents(data);
    } catch (error) {
      toast.error('Erro ao carregar eventos');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session && !hasLoadedRef.current) {
      loadEvents();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      hasLoadedRef.current = true; // Evitar tentar carregar novamente
    }
  }, [status, session, loadEvents]);

  const handleGenerateCertificate = async (eventId: string) => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    try {
      setGenerating(eventId);
      const result = await certificateApi.generate(eventId, session.user.id);
      toast.success('Certificado gerado com sucesso!');
      
      // Download do certificado
      const blob = await certificateApi.download(result.certificateCode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${result.certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao gerar certificado');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Certificados</h1>
          <p className="text-muted-foreground">
            Gere e baixe seus certificados de participação em eventos
          </p>
        </div>

        {status === 'loading' ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Carregando...</p>
          </div>
        ) : !session ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Info className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Faça login para gerar certificados</h3>
                  <p className="text-muted-foreground mb-6">
                    Você precisa estar logado para visualizar e gerar seus certificados de participação em eventos.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <Link href="/login" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Fazer Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/register">Criar Conta</Link>
                    </Button>
                  </div>
                </div>
                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Já tem um certificado? Valide-o aqui:
                  </p>
                  <Button asChild variant="secondary">
                    <Link href="/validate-certificate">Validar Certificado</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Carregando eventos...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{event.nome}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.detalhes}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.dataHoraInicio), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateCertificate(event.id)}
                      disabled={generating === event.id}
                      className="mt-auto"
                    >
                      {generating === event.id ? (
                        <>
                          <FileText className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Gerar Certificado
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {events.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      Nenhum certificado disponível
                    </p>
                    <p>
                      Você não tem eventos com presença confirmada para gerar certificados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}

