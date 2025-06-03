/**
 * Utilitaires pour la gestion des sessions côté client
 */

/**
 * Force la déconnexion et redirige vers la page de connexion
 * Utilisé notamment quand le rôle d'un utilisateur change
 */
export async function forceLogoutAndRedirect(reason?: string) {
  try {
    // Importer authClient dynamiquement pour éviter les problèmes SSR
    const { authClient } = await import("@/lib/auth-client");
    
    // Déconnecter l'utilisateur
    await authClient.signOut();
    
    // Rediriger vers la page de connexion avec un message
    const searchParams = new URLSearchParams();
    if (reason) {
      searchParams.set('message', reason);
    }
    
    const loginUrl = `/auth/login${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    window.location.href = loginUrl;
    
  } catch (error) {
    console.error('Erreur lors de la déconnexion forcée:', error);
    // En dernier recours, rediriger vers la page d'accueil
    window.location.href = '/';
  }
}

/**
 * Vérifie si l'utilisateur actuel a les permissions nécessaires
 * Si non, le déconnecte automatiquement
 */
export async function checkPermissionsAndLogout(requiredRole: 'admin' | 'customer') {
  try {
    const { authClient } = await import("@/lib/auth-client");
    const { data: session } = await authClient.getSession();
    
    if (!session) {
      return false; // Pas connecté
    }
    
    const userRole = session.user.role;
    
    // Vérifier les permissions
    if (requiredRole === 'admin' && userRole !== 'admin') {
      await forceLogoutAndRedirect('Vos permissions ont changé. Veuillez vous reconnecter.');
      return false;
    }
    
    return true; // Permissions OK
    
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Appelle l'API pour révoquer les sessions d'un utilisateur
 * (Fonction admin uniquement)
 */
export async function revokeUserSessions(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/session', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'revoke-user-sessions',
        userId
      })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la révocation des sessions');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la révocation des sessions:', error);
    return false;
  }
}

/**
 * Rafraîchit la session actuelle pour s'assurer qu'elle est à jour
 */
export async function refreshCurrentSession() {
  try {
    const { authClient } = await import("@/lib/auth-client");
    
    // Forcer le rechargement de la session depuis le serveur
    const { data: session } = await authClient.getSession({
      query: { disableCookieCache: true }
    });
    
    return session;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement de la session:', error);
    return null;
  }
} 