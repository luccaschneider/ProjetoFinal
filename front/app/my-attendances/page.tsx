'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { inscriptionApi } from '@/lib/api';
import { EventResponseDTO } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Tag, Award } from 'lucide-react';

export default function MyAttendancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadEvents = useCallback(async () => {
    if (hasLoadedRef.current) return;
    try {
      setIsLoading(true);
      hasLoadedRef.current = true;
      const data = await inscriptionApi.listarPresencas();
      setEvents(data);
    } catch (error) {
      toast.error('Erro ao carregar eventos com presença confirmada');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session && !hasLoadedRef.current) {
      loadEvents();
    }
  }, [status, session, router, loadEvents]);

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
          <h1 className="text-3xl font-bold mb-2">Minhas Presenças</h1>
          <p className="text-muted-foreground">Eventos em que você teve presença confirmada</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2">{event.nome}</CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    <Award className="h-3 w-3 mr-1" />
                    Presente
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{event.detalhes}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 mb-4">
                  {event.categoria && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <Badge variant="secondary">{event.categoria}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {event.localEvento && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.localEvento}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/events/${event.id}`}>Ver Detalhes</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/certificates">Gerar Certificado</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Você não tem presença confirmada em nenhum evento
          </div>
        )}
      </main>
    </>
  );
}

