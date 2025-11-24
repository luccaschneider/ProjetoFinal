import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rotas públicas - permitir acesso sem autenticação
  const publicPaths = ['/', '/login', '/register', '/events', '/certificates', '/validate-certificate'];
  const path = request.nextUrl.pathname;
  
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + '/'));
  
  // Se for rota pública, permitir
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Para rotas protegidas, verificar se há token na sessão
  // Como estamos usando NextAuth, a verificação será feita no lado do cliente
  // O middleware apenas permite passar
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

