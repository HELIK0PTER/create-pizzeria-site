"use client";

import { useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";

export function CheckSession() {
  const { data: session } = useSession();

  console.log(session);

  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      try {
        // Récupérer la session depuis la BDD
        const response = await fetch('/api/session/current');
        const serverSession = await response.json();

        console.log(serverSession);

        // Comparer avec la session locale
        if (
          !serverSession || 
          serverSession.user?.id !== session.user?.id ||
          serverSession.user?.role !== (session.user as { role?: string })?.role
        ) {
          // Sessions différentes -> déconnexion
          await signOut();
        }
      } catch (error) {
        console.error('Erreur vérification session:', error);
      }
    };

    // Vérifier au montage et toutes les 30 secondes
    checkSession();
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [session]);

  return null;
}
