import NextAuth, { type NextAuthOptions, User as NextAuthUser, Account, Profile, JWT } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { comparePassword, getUserByEmail } from '../../../lib/storage';
import dbConnect from '../../../lib/mongodb';
interface AuthorizeUser {
  id: string;
  email?: string | null;
  name?: string | null; 
  username?: string | null;
  fullName?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<AuthorizeUser | null> {
        await dbConnect(); 
        if (!credentials?.email || !credentials.password) { 
          console.log("[NextAuth Authorize] Missing email or password");
          return null;
        }
        console.log("[NextAuth Authorize] Received credentials:", { email: credentials.email })
        try {
          const userFromDb = await getUserByEmail(credentials.email);
          if (!userFromDb) {
            return null;
          }
          if (!userFromDb.password) {
            return null;
          }
          const isMatch = await comparePassword(credentials.password, userFromDb.password);
          if (!isMatch) {
            return null;
          }
          return {
              id: userFromDb._id.toString(),
              email: userFromDb.email,
              name: userFromDb.fullName || userFromDb.username,
              username: userFromDb.username,
              fullName: userFromDb.fullName,
          };
        } catch (dbError) {
          console.error("[NextAuth Authorize] Database error during authorization:", dbError);
          return null;
        }
    }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user } : { token: JWT; user?: AuthorizeUser | NextAuthUser; account?: Account | null; profile?: Profile; }): Promise<JWT> {
      if (user) { 
        token.id = user.id; 
        token.name = user.name;
        token.email = user.email;
        token.username = (user as any).username;
        token.fullName = (user as any).fullName;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> { 
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        (session.user as any).username = token.username as string | null | undefined; 
        (session.user as any).fullName = token.fullName as string | null | undefined;
      }
      return session;
  }
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

export default NextAuth(authOptions);