import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Vous pouvez l'activer plus tard
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ password, hash }: { password: string; hash: string }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: false, // Ne pas permettre la modification depuis l'inscription
      },
    },
  },
  // Configuration pour la production
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development-only",
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://create-pizzeria-site.vercel.app"
  ],
  // Configuration des cookies pour résoudre les problèmes CORS
  cookies: {
    domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  // Configuration CORS explicite
  cors: {
    enabled: true,
    allowedOrigins: [
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
      "http://localhost:3000",
      "https://create-pizzeria-site.vercel.app"
    ],
    allowCredentials: true
  },
  plugins: [
    admin(), // Plugin admin pour la gestion avancée des utilisateurs et sessions
    nextCookies(), // Plugin pour la gestion des cookies Next.js
  ],
});

export type Session = typeof auth.$Infer.Session; 