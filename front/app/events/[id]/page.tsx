'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { eventApi, inscriptionApi, adminApi } from '@/lib/api';
import { EventResponseDTO } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Tag, Users, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const quickRegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
});

type QuickRegisterForm = z.infer<typeof quickRegisterSchema>;

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInscribed, setIsInscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickRegisterForm>({
    resolver: zodResolver(quickRegisterSchema),
  });

  useEffect(() => {
    if (params.id) {
      // Carregar evento imediatamente (já verifica cache primeiro)
      loadEvent();
      
      // Só verificar inscrição se estiver online e autenticado
      if (typeof window !== 'undefined' && navigator.onLine && session) {
        checkInscription();
      }
    }
  }, [params.id, session]);

  const isNetworkError = (error: any): boolean => {
    return (
      (typeof window !== 'undefined' && !navigator.onLine) ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      (error.response === undefined && error.request !== undefined)
    );
  };

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      
      // SEMPRE verificar cache primeiro (especialmente importante quando offline)
      const { getCache } = await import('@/lib/cacheService');
      const { getCacheKey } = await import('@/lib/api');
      
      // Tentar diferentes formatos de chave de cache
      const possibleKeys = [
        getCacheKey(`/api/events/${params.id}`),
        `api_events_${params.id}`,
        `events_${params.id}`,
        `event_${params.id}`,
      ];
      
      // Verificar cache primeiro - se encontrar, usar imediatamente
      let cachedEvent: EventResponseDTO | null = null;
      let cacheKeyFound = '';
      
      for (const key of possibleKeys) {
        const cached = getCache<EventResponseDTO>(key);
        if (cached) {
          cachedEvent = cached;
          cacheKeyFound = key;
          console.log(`[Cache] ✅ Encontrado evento no cache com chave: ${key}`);
          break;
        }
      }
      
      // Se encontrou cache, usar imediatamente
      if (cachedEvent) {
        setEvent(cachedEvent);
        setIsLoading(false);
        
        // Se estiver offline, usar cache e não tentar requisição
        if (typeof window !== 'undefined' && !navigator.onLine) {
          toast.info('Offline: Exibindo dados do cache');
          return;
        }
        
        // Se estiver online, tentar atualizar em background (sem bloquear)
        // Mas já mostramos o cache, então a UI não fica travada
        eventApi.getById(params.id as string)
          .then((updatedData) => {
            // Se a atualização funcionou, atualizar o estado
            setEvent(updatedData);
            console.log('[Cache] ✅ Dados atualizados em background');
          })
          .catch((error) => {
            // Se falhar, manter o cache que já está sendo exibido
            console.debug('[Cache] ⚠️ Não foi possível atualizar, mantendo cache:', error.message);
          });
        
        return; // Retornar imediatamente após usar cache
      }
      
      // Se não encontrou cache e está offline, mostrar erro
      if (typeof window !== 'undefined' && !navigator.onLine) {
        toast.error('Sem conexão e sem dados em cache para este evento');
        setIsLoading(false);
        // Usar window.location para evitar RSC quando offline
        setTimeout(() => {
          window.location.href = '/events';
        }, 2000);
        return;
      }
      
      // Se não encontrou cache mas está online, fazer requisição
      // (getWithCache vai tentar cache novamente e fazer requisição se necessário)
      const data = await eventApi.getById(params.id as string);
      setEvent(data);
    } catch (error: any) {
      console.error('Erro ao carregar evento:', error);
      
      // Tentar buscar do cache como último recurso
      const { getCache } = await import('@/lib/cacheService');
      const { getCacheKey } = await import('@/lib/api');
      
      const possibleKeys = [
        getCacheKey(`/api/events/${params.id}`),
        `api_events_${params.id}`,
        `events_${params.id}`,
        `event_${params.id}`,
      ];
      
      for (const key of possibleKeys) {
        const cached = getCache<EventResponseDTO>(key);
        if (cached) {
          console.log(`[Cache] Usando cache após erro: ${key}`);
          setEvent(cached);
          toast.warning('Usando dados em cache devido a erro na requisição');
          return;
        }
      }
      
      // Se não encontrou cache em lugar nenhum
      toast.error(error.message || 'Erro ao carregar evento');
      setTimeout(() => {
        // Usar window.location quando offline para evitar RSC
        if (typeof window !== 'undefined' && !navigator.onLine) {
          window.location.href = '/events';
        } else {
          router.push('/events');
        }
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInscription = async () => {
    if (!session) return;
    try {
      const inscritos = await inscriptionApi.listarInscritos();
      setIsInscribed(inscritos.some((e) => e.id === params.id));
    } catch (error) {
      // Ignorar erro
    }
  };

  const handleInscription = async () => {
    if (!session) {
      toast.error('Você precisa estar logado para se inscrever');
      if (typeof window !== 'undefined' && !navigator.onLine) {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
      return;
    }
    try {
      setIsSubmitting(true);
      await inscriptionApi.inscrever(params.id as string);
      toast.success('Inscrição realizada com sucesso!');
      setIsInscribed(true);
      
      // Só fazer refresh se estiver online (evita RSC quando offline)
      if (typeof window !== 'undefined' && navigator.onLine) {
        router.refresh();
      }
    } catch (error: any) {
      console.error('Erro ao inscrever:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        if (typeof window !== 'undefined' && !navigator.onLine) {
          window.location.href = '/login';
        } else {
          router.push('/login');
        }
      } else {
      toast.error(error.response?.data?.message || 'Erro ao se inscrever');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInscription = async () => {
    try {
      setIsSubmitting(true);
      await inscriptionApi.cancelarInscricao(params.id as string);
      toast.success('Inscrição cancelada com sucesso!');
      setIsInscribed(false);
      
      // Só fazer refresh se estiver online (evita RSC quando offline)
      if (typeof window !== 'undefined' && navigator.onLine) {
        router.refresh();
      }
    } catch (error: any) {
      toast.error('Erro ao cancelar inscrição');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRegister = async (data: QuickRegisterForm) => {
    // Verificar se está offline ANTES de qualquer coisa
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    
    // Se estiver offline, salvar diretamente offline SEM tentar requisição
    if (isOffline) {
      try {
        setIsSubmitting(true);
        
        // Salvar diretamente offline sem tentar fazer requisição
        const { saveOperation } = await import('@/lib/offlineStorage');
        saveOperation('CADASTRO_RAPIDO', {
          name: data.name,
          email: data.email,
          eventId: params.id as string,
        });
        
        // Fechar dialog e limpar form IMEDIATAMENTE
        setIsQuickRegisterOpen(false);
        reset();
        
        // Mostrar mensagem de sucesso
        toast.success('Operação salva offline. Será sincronizada quando a conexão voltar.');
      } catch (error: any) {
        console.error('Erro ao salvar offline:', error);
        toast.error('Erro ao salvar operação offline');
      } finally {
        setIsSubmitting(false);
      }
      
      // Retornar imediatamente - NÃO fazer mais nada quando offline
      // NÃO fazer refresh, NÃO fazer reload, apenas fechar dialog
      return;
    }
    
    // Se está online, fazer requisição normalmente
    try {
      setIsSubmitting(true);
      
      await adminApi.cadastroRapido({
        name: data.name,
        email: data.email,
        eventId: params.id as string,
      });
      
      // Fechar dialog e resetar form
      setIsQuickRegisterOpen(false);
      reset();
      toast.success('Usuário cadastrado, inscrito e presença confirmada!');
      
      // NÃO fazer refresh automaticamente - deixar o usuário decidir quando atualizar
      // Isso evita problemas quando a conexão está instável
    } catch (error: any) {
      // Se for erro de rede, pode ter ficado offline durante a requisição
      const isNetworkErr = typeof window !== 'undefined' && (
        !navigator.onLine || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ERR_ADDRESS_UNREACHABLE' ||
        error.message === 'Network Error' ||
        error.message?.includes('unreachable') ||
        (error.response === undefined && error.request !== undefined)
      );
      
      if (isNetworkErr) {
        // Se ficou offline durante a requisição, fechar dialog e não fazer refresh
        setIsQuickRegisterOpen(false);
        reset();
        // O mutateWithOffline já salvou offline e mostrou mensagem
        // Não fazer refresh quando offline
      } else {
        toast.error(error.response?.data?.message || 'Erro ao cadastrar usuário');
        // Se não for erro de rede, manter dialog aberto para o usuário tentar novamente
        // Não fechar dialog para permitir nova tentativa
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!event) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{event.nome}</CardTitle>
                  <CardDescription className="text-base">{event.detalhes}</CardDescription>
                </div>
                {event.categoria && (
                  <Badge variant="secondary" className="text-sm">
                    {event.categoria}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Data e Hora</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} -{' '}
                      {format(new Date(event.dataHoraFim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                {event.localEvento && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Local</div>
                      <div className="text-sm text-muted-foreground">{event.localEvento}</div>
                    </div>
                  </div>
                )}
                {event.capacidadeMaxima && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Capacidade</div>
                      <div className="text-sm text-muted-foreground">{event.capacidadeMaxima} pessoas</div>
                    </div>
                  </div>
                )}
                {event.precoIngresso && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Preço</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(event.precoIngresso)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4 border-t">
                {session ? (
                  isInscribed ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelInscription}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Cancelando...' : 'Cancelar Inscrição'}
                    </Button>
                  ) : (
                    <Button onClick={handleInscription} disabled={isSubmitting}>
                      {isSubmitting ? 'Inscrevendo...' : 'Inscrever-se'}
                    </Button>
                  )
                ) : (
                  <Button asChild>
                    <a href="/login">Faça login para se inscrever</a>
                  </Button>
                )}
                {session?.user?.role === 'ADMIN' && (
                  <Dialog 
                    open={isQuickRegisterOpen} 
                    onOpenChange={(open) => {
                      // Controlar abertura/fechamento do dialog
                      // Quando fechar, apenas atualizar estado - não fazer refresh
                      setIsQuickRegisterOpen(open);
                      // Se estiver fechando e offline, garantir que não haja reload
                      // Não fazer nada além de atualizar o estado
                    }}
                    modal={true}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">Cadastro Rápido</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cadastro Rápido de Usuário</DialogTitle>
                        <DialogDescription>
                          Cadastre um usuário, inscreva no evento e confirme presença automaticamente
                        </DialogDescription>
                      </DialogHeader>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubmit(handleQuickRegister)(e);
                        }} 
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="quick-name">Nome</Label>
                          <Input id="quick-name" {...register('name')} />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-email">Email</Label>
                          <Input id="quick-email" type="email" {...register('email')} />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Cadastrando...' : 'Cadastrar e Confirmar Presença'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

