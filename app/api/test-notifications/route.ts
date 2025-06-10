import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    const { type } = await request.json()

    if (type === 'email') {
      const result = await notificationService.testEmailConfiguration()
      return NextResponse.json(result)
    } else if (type === 'sms') {
      const result = await notificationService.testSMSConfiguration()
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Type de test invalide' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erreur test notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 