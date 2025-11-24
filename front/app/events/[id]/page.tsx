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
      loadEvent();
      checkInscription();
    }
  }, [params.id, session]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const data = await eventApi.getById(params.id as string);
      setEvent(data);
    } catch (error) {
      toast.error('Erro ao carregar evento');
      router.push('/events');
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
      router.push('/login');
      return;
    }
    try {
      setIsSubmitting(true);
      await inscriptionApi.inscrever(params.id as string);
      toast.success('Inscrição realizada com sucesso!');
      setIsInscribed(true);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao se inscrever');
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
      router.refresh();
    } catch (error: any) {
      toast.error('Erro ao cancelar inscrição');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRegister = async (data: QuickRegisterForm) => {
    try {
      setIsSubmitting(true);
      await adminApi.cadastroRapido({
        name: data.name,
        email: data.email,
        eventId: params.id as string,
      });
      toast.success('Usuário cadastrado, inscrito e presença confirmada!');
      setIsQuickRegisterOpen(false);
      reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar usuário');
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
                  <Dialog open={isQuickRegisterOpen} onOpenChange={setIsQuickRegisterOpen}>
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
                      <form onSubmit={handleSubmit(handleQuickRegister)} className="space-y-4">
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

