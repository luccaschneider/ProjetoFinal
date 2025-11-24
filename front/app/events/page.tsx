'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { eventApi } from '@/lib/api';
import { EventResponseDTO } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Tag, Clock, Users, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true); // Default para true (assumir online no SSR)
  const preloadedEventIdsRef = useRef<Set<string>>(new Set());

  // Monitorar status de rede (apenas no cliente)
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return;
    
    // Inicializar com o status atual
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventApi.listAll();
      setEvents(data);
      
      // Pré-carregar detalhes de TODOS os eventos IMEDIATAMENTE em background
      // Isso garante que os detalhes estejam em cache quando o usuário acessar
      // IMPORTANTE: Pré-carregar TODOS, mesmo que já tenham sido pré-carregados antes
      if (data.length > 0 && typeof window !== 'undefined' && navigator.onLine) {
        // Pré-carregar TODOS os eventos (não verificar se já foram pré-carregados)
        // Isso garante que os dados estejam sempre atualizados no cache
        console.log(`🔄 Iniciando pré-carregamento de ${data.length} eventos...`);
        preloadEventDetails(data);
      }
    } catch (error: any) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        toast.warning('Sem conexão. Exibindo eventos em cache.');
      } else {
        toast.error('Erro ao carregar eventos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const preloadEventDetails = async (eventsList: EventResponseDTO[]) => {
    // Executar imediatamente em background (sem delay)
    const executePreload = async () => {
      try {
        console.log(`🔄 Iniciando pré-carregamento FORÇADO de detalhes de ${eventsList.length} eventos...`);
        
        // Processar em lotes para não sobrecarregar
        const batchSize = 5; // Lotes menores para garantir que todas as requisições sejam feitas
        let successCount = 0;
        
        for (let i = 0; i < eventsList.length; i += batchSize) {
          const batch = eventsList.slice(i, i + batchSize);
          
          // Executar todas as requisições em paralelo
          // IMPORTANTE: Forçar requisição mesmo que já tenha cache
          const results = await Promise.allSettled(
            batch.map(async (event) => {
              try {
                // Usar eventApi.getById com forceRefresh=true para forçar requisição
                // Isso garante que os dados sejam sempre buscados do servidor e salvos no cache
                await eventApi.getById(event.id, true);
                
                // Marcar como pré-carregado
                preloadedEventIdsRef.current.add(event.id);
                successCount++;
                console.log(`✅ Pré-carregado (${successCount}/${eventsList.length}): ${event.nome}`);
                return true;
              } catch (error: any) {
                console.debug(`⚠️ Evento ${event.id} não pôde ser pré-carregado:`, error.message);
                return false;
              }
            })
          );
          
          // Pequeno delay entre lotes para não sobrecarregar
          if (i + batchSize < eventsList.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
        
        console.log(`✅ Pré-carregamento concluído: ${successCount}/${eventsList.length} eventos carregados com sucesso`);
      } catch (error) {
        console.error('Erro no pré-carregamento de detalhes:', error);
      }
    };
    
    // Executar imediatamente (sem delay)
    executePreload();
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Carregando eventos...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Eventos
          </h1>
          <p className="text-lg text-muted-foreground">Explore todos os eventos disponíveis e encontre o que mais combina com você</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isPast = new Date(event.dataHoraFim) < new Date();
            const isToday = new Date(event.dataHoraInicio).toDateString() === new Date().toDateString();
            
            return (
              <Card 
                key={event.id} 
                className="flex flex-col hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group overflow-hidden"
              >
                <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
                  {isPast && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-muted">Finalizado</Badge>
                    </div>
                  )}
                  {isToday && !isPast && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 hover:bg-green-700">Hoje</Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="h-20 w-20 text-primary/20" />
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {event.nome}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {event.detalhes || 'Sem descrição disponível'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  <div className="space-y-3">
                    {event.categoria && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="font-medium">
                          {event.categoria}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {format(new Date(event.dataHoraInicio), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Duração: {Math.round((new Date(event.dataHoraFim).getTime() - new Date(event.dataHoraInicio).getTime()) / (1000 * 60 * 60))}h
                      </span>
                    </div>
                    {event.localEvento && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-1">
                          {event.localEvento}
                        </span>
                      </div>
                    )}
                    {event.capacidadeMaxima && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Capacidade: {event.capacidadeMaxima} pessoas
                        </span>
                      </div>
                    )}
                    {event.precoIngresso && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground font-medium">
                          {formatCurrency(event.precoIngresso)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button 
                    asChild={isOnline}
                    className="mt-auto w-full group/btn"
                    size="lg"
                    onClick={!isOnline ? (e) => {
                      e.preventDefault();
                      // Usar window.location para evitar RSC quando offline
                      window.location.href = `/events/${event.id}`;
                    } : undefined}
                  >
                    {isOnline ? (
                      <Link 
                        href={`/events/${event.id}`} 
                        prefetch={true}
                        className="flex items-center justify-center gap-2"
                      >
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <span className="flex items-center justify-center gap-2 cursor-pointer">
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {events.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground">
              Não há eventos disponíveis no momento. Tente novamente mais tarde.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

