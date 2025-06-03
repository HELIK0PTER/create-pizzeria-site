import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdminAPI } from '@/lib/auth-helpers'

// DELETE /api/session - Révoquer des sessions
export async function DELETE(request: Request) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await request.json()
    const { action, userId, sessionToken } = body

    switch (action) {
      case 'revoke-user-sessions':
        // Révoquer toutes les sessions d'un utilisateur spécifique
        if (!userId) {
          return NextResponse.json(
            { error: 'userId requis pour cette action' },
            { status: 400 }
          )
        }

        const revokedSessions = await auth.api.revokeUserSessions({
          body: { userId },
          headers: request.headers
        })

        return NextResponse.json({
          message: `Toutes les sessions de l'utilisateur ont été révoquées`,
          revokedSessions
        })

      case 'revoke-session':
        // Révoquer une session spécifique
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'sessionToken requis pour cette action' },
            { status: 400 }
          )
        }

        const revokedSession = await auth.api.revokeSession({
          body: { token: sessionToken },
          headers: request.headers
        })

        return NextResponse.json({
          message: 'Session révoquée avec succès',
          revokedSession
        })

      case 'revoke-all-sessions':
        // Révoquer toutes les sessions (attention: action dangereuse)
        // Cette action nécessiterait une implémentation personnalisée
        // car Better Auth n'a pas de méthode pour révoquer TOUTES les sessions
        return NextResponse.json(
          { error: 'Action non implémentée pour des raisons de sécurité' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { error: 'Action non reconnue. Actions disponibles: revoke-user-sessions, revoke-session' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erreur lors de la révocation des sessions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la révocation des sessions' },
      { status: 500 }
    )
  }
}

// GET /api/session - Obtenir des informations sur les sessions
export async function GET(request: Request) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Obtenir les sessions d'un utilisateur spécifique
      const sessions = await auth.api.listUserSessions({
        body: { userId },
        headers: request.headers
      })

      return NextResponse.json({
        userId,
        sessions
      })
    } else {
      // Pour l'instant, on ne peut pas lister TOUTES les sessions
      // Better Auth ne fournit pas cette fonctionnalité par défaut
      return NextResponse.json({
        error: 'userId requis pour lister les sessions'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    )
  }
} 