import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Vérifie si l'utilisateur actuel est authentifié
 * Pour utilisation dans les Server Components et Server Actions
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    throw new Error("Non authentifié");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur actuel est un administrateur
 * Pour utilisation dans les Server Components et Server Actions
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new Error("Accès refusé : permissions administrateur requises");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur actuel est un livreur
 * Pour utilisation dans les Server Components et Server Actions
 */
export async function requireDelivery() {
  const session = await requireAuth();

  if (session.user.role !== "delivery") {
    throw new Error("Accès refusé : permissions livreur requises");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur actuel est un livreur ou un administrateur
 * Pour utilisation dans les Server Components et Server Actions
 */
export async function requireDeliveryOrAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "delivery" && session.user.role !== "admin") {
    throw new Error("Accès refusé : permissions livreur ou administrateur requises");
  }

  return session;
}

/**
 * Vérifie l'authentification pour les routes API
 * Pour utilisation dans les API Routes
 */
export async function requireAuthAPI(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session) {
    return { error: "Non authentifié", status: 401 };
  }

  return { session, error: null, status: null };
}

/**
 * Vérifie les permissions admin pour les routes API
 * Pour utilisation dans les API Routes
 */
export async function requireAdminAPI(request: Request) {
  const { session, error, status } = await requireAuthAPI(request);
  
  if (error) {
    return { error, status };
  }

  if (session!.user.role !== "admin") {
    return { 
      error: "Accès refusé : permissions administrateur requises", 
      status: 403 
    };
  }

  return { session, error: null, status: null };
}

/**
 * Vérifie les permissions livreur ou admin pour les routes API
 * Pour utilisation dans les API Routes
 */
export async function requireDeliveryOrAdminAPI(request: Request) {
  const { session, error, status } = await requireAuthAPI(request);
  
  if (error) {
    return { error, status };
  }

  if (session!.user.role !== "delivery" && session!.user.role !== "admin") {
    return { 
      error: "Accès refusé : permissions livreur ou administrateur requises", 
      status: 403 
    };
  }

  return { session, error: null, status: null };
}

/**
 * Vérifie si l'utilisateur actuel peut modifier un autre utilisateur
 * Règles : 
 * - Les admins peuvent modifier tous les utilisateurs
 * - Les utilisateurs peuvent modifier uniquement leur propre profil
 */
export async function canModifyUser(targetUserId: string) {
  const session = await requireAuth();
  
  // Admin peut tout modifier
  if (session.user.role === "admin") {
    return true;
  }
  
  // Utilisateur peut modifier seulement son propre profil
  return session.user.id === targetUserId;
} 