import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/db";
import { verifyPassword } from "./password";
import { UserRole } from "./roles";

const KNOWN_DEMO_EMAILS = [
  "ramesh.meena@example.tribal.gov.in",
  "priya.sharma@tribal.gov.in",
  "rajesh.verma@tribal.gov.in",
  "sunita.rao@tribal.gov.in",
];

export const nextAuthConfig: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "TribalScholar Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@tribal.gov.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // 1. Query Prisma User by normalized email
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // 2. Reject if non-existent, inactive, or missing password hash
        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        // 3. Verify password against stored bcrypt hash
        const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        // 4. Derive demo indicator server-side only (never trusted from client)
        const isDemo = KNOWN_DEMO_EMAILS.includes(user.email);

        // 5. Return server-sourced user identity
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role as UserRole,
          isActive: user.isActive,
          isDemoSession: isDemo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.isActive = user.isActive;
        token.isDemoSession = user.isDemoSession;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.isDemoSession = Boolean(token.isDemoSession);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
