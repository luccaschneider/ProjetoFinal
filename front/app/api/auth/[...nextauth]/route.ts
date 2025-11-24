import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import type { NextAuthConfig } from 'next-auth';

// Garantir que o secret está definido
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!secret) {
  console.warn('⚠️  NEXTAUTH_SECRET ou AUTH_SECRET não está definido. Defina uma das variáveis no arquivo .env.local');
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Configurar URL base para NextAuth
const AUTH_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

const config = {
  // Confiar no host em produção (necessário para IPs e domínios customizados)
  trustHost: true,
  // URL base do servidor (opcional, mas recomendado)
  ...(AUTH_URL && { basePath: undefined }), // NextAuth detecta automaticamente se AUTH_URL estiver definido
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
          
          // Fazer chamada direta ao backend sem usar o apiClient (que depende de sessão)
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/login`,
            {
              email: credentials.email as string,
              password: credentials.password as string,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 10000, // 10 segundos de timeout
            }
          );

          const loginResponse = response.data;
          console.log('Login successful for:', loginResponse.email);

          return {
            id: loginResponse.id,
            email: loginResponse.email,
            name: loginResponse.name,
            role: loginResponse.role,
            accessToken: loginResponse.token,
          };
        } catch (error: any) {
          console.error('Login error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: secret || 'fallback-secret-for-development-only-change-in-production',
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

export const { GET, POST } = handlers;

