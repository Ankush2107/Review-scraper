import 'next-auth';
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

interface ExtendedUserProperties {
  id: string;
  username?: string | null;
  fullName?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null; 
      fullName?: string | null; 
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    id: string;
    username?: string | null;
    fullName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, ExtendedUserProperties {
    id: string;
    username?: string | null;
    fullName?: string | null;
  }
}