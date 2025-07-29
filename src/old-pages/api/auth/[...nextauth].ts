import NextAuth, { type NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import StravaProvider from "next-auth/providers/strava";
import EmailProvider from "next-auth/providers/email";
import CredentialProvider from "next-auth/providers/credentials";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "@root/src/env/server.mjs";
import { prisma } from "@root/src/server/db/client";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    redirect() {
      return "/";
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: env.FACEBOOK_ID,
      clientSecret: env.FACEBOOK_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    }),
    StravaProvider({
      clientId: env.STRAVA_CLIENT_ID,
      clientSecret: env.STRAVA_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // process.env.EMAIL_SERVER,
    }),
    CredentialProvider({
      name: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        console.log("credentials", credentials);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) throw new Error("wrong credentials");
        const pwdOk = await bcrypt.compare(
          credentials.password,
          user.password ?? ""
        );
        if (!pwdOk) throw new Error("wrong credentials");
        console.log("user", user);
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/user/signin",
  },
  debug: true,
  session: {
    strategy: "database",
  },
};

export default NextAuth(authOptions);
