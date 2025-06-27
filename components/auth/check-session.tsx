"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "@/lib/auth-client";

export function CheckSession() {
  const { data: session } = useSession();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      // Éviter les vérifications simultanées
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // Récupérer la session depuis la BDD
        const response = await fetch("/api/session/current");

        // Vérifier si la réponse est valide
        if (!response.ok) {
          if (response.status === 401) {
            // Session expirée côté serveur
            await signOut();
          }
          return;
        }

        const serverSession = await response.json();

        // Comparer avec la session locale
        const sessionUser = session.user as
          | { id?: string; role?: string }
          | undefined;

        // Être plus permissif : seulement déconnecter si vraiment pas de session serveur
        // ou si l'ID utilisateur est différent (pas seulement le rôle qui peut changer)
        if (
          !serverSession ||
          !serverSession.session ||
          !serverSession.session.user ||
          serverSession.session.user.id !== sessionUser?.id
        ) {
          console.warn(`Session serveur/client désynchronisée, déconnexion...`);
          await signOut();
        }
      } catch (error) {
        console.error(`Erreur vérification session:`, error);
        // En cas d'erreur réseau, on ne déconnecte pas automatiquement
        // mais on log l'erreur pour le debugging
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Vérifier au montage et toutes les 30 secondes
    checkSession();
    const interval = setInterval(checkSession, 30000);

    return () => {
      clearInterval(interval);
      isCheckingRef.current = false;
    };
  }, [session]);

  return null;
}
