import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite", // Changez en "postgresql" si vous utilisez Postgres
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Vous pouvez l'activer plus tard
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
  plugins: [
    admin(), // Plugin admin pour la gestion avancée des utilisateurs et sessions
    nextCookies(), // Plugin pour la gestion des cookies Next.js
  ],
});

export type Session = typeof auth.$Infer.Session; 