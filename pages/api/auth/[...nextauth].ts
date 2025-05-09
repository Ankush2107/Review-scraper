import NextAuth, { type NextAuthOptions, User as NextAuthUser, Account, Profile, JWT } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsername, comparePassword } from '../../../lib/storage';
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
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<AuthorizeUser | null> {
        await dbConnect(); 
        if (!credentials?.username || !credentials.password) { 
          return null;
        }
        const user = await getUserByUsername(credentials.username); 
        if (!user || !user.password) { 
          return null;
        }
        const isMatch = await comparePassword(credentials.password, user.password);
        if (!isMatch) {
          return null;
        }
        return { 
          id: user._id.toString(),
          email: user.email,
          name: user.fullName || user.username, 
          username: user.username,             
          fullName: user.fullName, 
        };
    }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile } : { token: JWT; user?: AuthorizeUser | NextAuthUser; account?: Account | null; profile?: Profile; }): Promise<JWT> {
      if (user) { 
        token.id = user.id; 
        token.name = user.name;
        token.email = user.email;
        const customUser = user as AuthorizeUser;
        token.username = customUser.username;
        token.fullName = customUser.fullName;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> { 
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.username = token.username as string | null | undefined; 
        session.user.fullName = token.fullName as string | null | undefined;
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