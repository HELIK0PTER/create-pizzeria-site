import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import type { Session as ServerSession } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || (
    typeof window !== "undefined" 
      ? window.location.origin 
      : "http://localhost:3000"
  ),
  plugins: [adminClient()],
  // Configuration explicite pour production
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export type Session = ServerSession;
