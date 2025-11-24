'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { UsuarioResponseDTO } from '@/lib/types';
import { User, Mail, Phone, FileText, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255, 'Nome deve ter no máximo 255 caracteres'),
  telefone: z.string().optional().or(z.literal('')),
  documento: z.string().optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<UsuarioResponseDTO | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const userProfile = await authApi.getMe();
      setProfile(userProfile);
      reset({
        name: userProfile.name,
        telefone: userProfile.telefone || '',
        documento: userProfile.documento || '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session) {
      loadProfile();
    }
  }, [status, session, router, loadProfile]);

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
  };

  const formatarDocumento = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/\.$|-$/g, '');
    } else {
      // CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').replace(/\.$|\/$|-$/g, '');
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const updatedProfile = await authApi.updateProfile({
        name: data.name,
        telefone: data.telefone || undefined,
        documento: data.documento || undefined,
      });

      setProfile(updatedProfile);
      
      // Atualizar sessão do NextAuth
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updatedProfile.name,
        },
      });

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (isLoadingProfile) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados de perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="text"
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                      {...register('telefone')}
                      onChange={(e) => {
                        const formatted = formatarTelefone(e.target.value);
                        e.target.value = formatted;
                        register('telefone').onChange(e);
                      }}
                    />
                  </div>
                  {errors.telefone && (
                    <p className="text-sm text-destructive">{errors.telefone.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Opcional - Formato: (XX) XXXXX-XXXX</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento">CPF/CNPJ</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="documento"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      className="pl-10"
                      {...register('documento')}
                      onChange={(e) => {
                        const formatted = formatarDocumento(e.target.value);
                        e.target.value = formatted;
                        register('documento').onChange(e);
                      }}
                    />
                  </div>
                  {errors.documento && (
                    <p className="text-sm text-destructive">{errors.documento.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Opcional - CPF ou CNPJ</p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset({
                        name: profile?.name || '',
                        telefone: profile?.telefone || '',
                        documento: profile?.documento || '',
                      });
                    }}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Tipo de Conta</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Conta Criada</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
              {profile?.updatedAt && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Última Atualização</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

