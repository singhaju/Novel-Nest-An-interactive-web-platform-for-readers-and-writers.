import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
// In a real app, you'd use a robust hashing library like bcrypt
// For this example, we'll use simple string comparison for demonstration.

export const authOptions: NextAuthOptions = {
  secret: 'novel-nest-super-secret-key-for-development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (user && user.password === credentials.password) { // IMPORTANT: Use bcrypt.compare in a real app
          return { 
              id: user.user_id.toString(), 
              name: user.username, 
              email: user.email, 
              role: user.role 
            };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Redirect to home/login page on sign in error
  }
};

export default NextAuth(authOptions);