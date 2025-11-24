import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: 'USER' | 'ADMIN';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: 'USER' | 'ADMIN';
    id?: string;
  }
}

