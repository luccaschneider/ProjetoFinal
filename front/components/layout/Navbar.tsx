'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NetworkStatus } from './NetworkStatus';
import { SyncButton } from './SyncButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Calendar, Award, FileText, Activity, Users, Menu, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: session } = useSession({
    required: false,
  });
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold hover:text-primary transition-colors">
            Eventos
          </Link>
          
          <div className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
            <Link 
              href="/" 
              className={cn(
                "relative text-sm font-medium px-3 py-2 transition-colors",
                isActive('/') && pathname !== '/login' && pathname !== '/register'
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Início
              {isActive('/') && pathname !== '/login' && pathname !== '/register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "relative text-sm font-medium px-3 py-2 transition-colors flex items-center gap-1",
                    isActive('/events') || isActive('/my-events') || isActive('/my-attendances') || isActive('/admin/attendance')
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Eventos
                  <ChevronDown className="h-3 w-3" />
                  {(isActive('/events') || isActive('/my-events') || isActive('/my-attendances') || isActive('/admin/attendance')) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Eventos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/events" className="flex items-center w-full cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver Eventos
                  </Link>
                </DropdownMenuItem>
                {session && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-events" className="flex items-center w-full cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        Minhas Inscrições
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-attendances" className="flex items-center w-full cursor-pointer">
                        <Award className="mr-2 h-4 w-4" />
                        Minhas Presenças
                      </Link>
                    </DropdownMenuItem>
                    {session.user?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/attendance" className="flex items-center w-full cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            Gerenciar Presenças
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "relative text-sm font-medium px-3 py-2 transition-colors flex items-center gap-1",
                    isActive('/certificates') || isActive('/validate-certificate')
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Certificados
                  <ChevronDown className="h-3 w-3" />
                  {(isActive('/certificates') || isActive('/validate-certificate')) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Certificados</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/validate-certificate" className="flex items-center w-full cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Validar Certificado
                  </Link>
                </DropdownMenuItem>
                {session && (
                  <DropdownMenuItem asChild>
                    <Link href="/certificates" className="flex items-center w-full cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar Certificado
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {session && (
              <Link 
                href="/my-logs" 
                className={cn(
                  "relative text-sm font-medium px-3 py-2 transition-colors",
                  isActive('/my-logs')
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Meus Logs
                {isActive('/my-logs') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <SyncButton />
            <NetworkStatus />
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-9">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                      <div className="mt-1">
                        {session.user?.role === 'ADMIN' ? (
                          <Badge variant="default" className="text-xs">Administrador</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Usuário</Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-events" className="flex items-center w-full cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      Meus Eventos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-attendances" className="flex items-center w-full cursor-pointer">
                      <Award className="mr-2 h-4 w-4" />
                      Minhas Presenças
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/certificates" className="flex items-center w-full cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      Certificados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-logs" className="flex items-center w-full cursor-pointer">
                      <Activity className="mr-2 h-4 w-4" />
                      Meus Logs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 text-sm font-medium transition-colors",
                isActive('/') && pathname !== '/login' && pathname !== '/register'
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Início
            </Link>
            
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Eventos
            </div>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 text-sm font-medium transition-colors",
                isActive('/events')
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Calendar className="inline-block mr-2 h-4 w-4" />
              Ver Eventos
            </Link>
            {session && (
              <>
                <Link
                  href="/my-events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm font-medium transition-colors",
                    isActive('/my-events')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Calendar className="inline-block mr-2 h-4 w-4" />
                  Minhas Inscrições
                </Link>
                <Link
                  href="/my-attendances"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm font-medium transition-colors",
                    isActive('/my-attendances')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Award className="inline-block mr-2 h-4 w-4" />
                  Minhas Presenças
                </Link>
                {session.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin/attendance"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-2 text-sm font-medium transition-colors",
                      isActive('/admin/attendance')
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Users className="inline-block mr-2 h-4 w-4" />
                    Gerenciar Presenças
                  </Link>
                )}
              </>
            )}

            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">
              Certificados
            </div>
            <Link
              href="/validate-certificate"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 text-sm font-medium transition-colors",
                isActive('/validate-certificate')
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <FileText className="inline-block mr-2 h-4 w-4" />
              Validar Certificado
            </Link>
            {session && (
              <Link
                href="/certificates"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-2 text-sm font-medium transition-colors",
                  isActive('/certificates')
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <FileText className="inline-block mr-2 h-4 w-4" />
                Gerar Certificado
              </Link>
            )}

            {session && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">
                  Outros
                </div>
                <Link
                  href="/my-logs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm font-medium transition-colors",
                    isActive('/my-logs')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Activity className="inline-block mr-2 h-4 w-4" />
                  Meus Logs
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

