'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { eventApi, adminApi } from '@/lib/api';
import { EventResponseDTO, UsuarioInscritoDTO } from '@/lib/types';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [usuariosInscritos, setUsuariosInscritos] = useState<UsuarioInscritoDTO[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioInscritoDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadEvents();
    }
  }, [status, session]);

  useEffect(() => {
    if (selectedEventId) {
      loadUsuariosInscritos(selectedEventId);
    } else {
      setUsuariosInscritos([]);
      setFilteredUsuarios([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = usuariosInscritos.filter(
        (u) =>
          u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsuarios(filtered);
    } else {
      setFilteredUsuarios(usuariosInscritos);
    }
  }, [searchTerm, usuariosInscritos]);

  const loadEvents = async () => {
    try {
      const data = await eventApi.listAll();
      setEvents(data.filter((e) => e.ativo));
    } catch (error: any) {
      toast.error('Erro ao carregar eventos');
      console.error(error);
    }
  };

  const loadUsuariosInscritos = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await adminApi.listUsuariosInscritosNoEvento(eventId);
      setUsuariosInscritos(data);
      setFilteredUsuarios(data);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários inscritos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePresenca = async (usuarioId: string, presente: boolean) => {
    if (!selectedEventId) return;

    setUpdating(usuarioId);
    try {
      await adminApi.registrarPresenca({
        usuarioId,
        eventId: selectedEventId,
        presente: !presente,
      });
      toast.success(`Presença ${!presente ? 'registrada' : 'removida'} com sucesso`);
      await loadUsuariosInscritos(selectedEventId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao atualizar presença';
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const presentesCount = usuariosInscritos.filter((u) => u.presente).length;
  const totalCount = usuariosInscritos.length;

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                Acesso negado. Apenas administradores podem acessar esta página.
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Presenças
          </CardTitle>
          <CardDescription>
            Selecione um evento para gerenciar as presenças dos usuários inscritos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Evento</label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.nome} - {format(new Date(event.dataHoraInicio), "dd/MM/yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold">{selectedEvent.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvent.dataHoraInicio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{presentesCount}</div>
                  <div className="text-sm text-muted-foreground">de {totalCount} presentes</div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar usuário</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Usuários Inscritos ({filteredUsuarios.length})
                    </div>
                    <div className="border rounded-lg divide-y">
                      {filteredUsuarios.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário inscrito neste evento'}
                        </div>
                      ) : (
                        filteredUsuarios.map((usuario) => (
                          <div
                            key={usuario.usuarioId}
                            className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{usuario.nome}</span>
                                {usuario.presente && (
                                  <Badge variant="default" className="text-xs">
                                    Presente
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{usuario.email}</div>
                              {usuario.telefone && (
                                <div className="text-sm text-muted-foreground">{usuario.telefone}</div>
                              )}
                              {usuario.presente && usuario.confirmedAt && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Confirmado em:{' '}
                                  {format(new Date(usuario.confirmedAt), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              )}
                            </div>
                            <Button
                              variant={usuario.presente ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleTogglePresenca(usuario.usuarioId, usuario.presente)}
                              disabled={updating === usuario.usuarioId}
                            >
                              {updating === usuario.usuarioId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : usuario.presente ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Remover Presença
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Marcar Presença
                                </>
                              )}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </main>
    </>
  );
}

