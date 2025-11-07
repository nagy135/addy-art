import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'author';
    };
  }

  interface User {
    role: 'admin' | 'author';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'author';
  }
}



