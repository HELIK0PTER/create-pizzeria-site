// Service de notifications (Email & SMS)
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { OrderNotification } from './order-status-manager'
import { OrderStatus, ORDER_STATUS_CONFIG } from './utils'

interface NotificationSettings {
  // Général
  notificationsEnabled: boolean
  
  // Email
  emailNotificationsEnabled: boolean
  smtpHost?: string | null
  smtpPort: number
  smtpSecure: boolean
  smtpUser?: string | null
  smtpPassword?: string | null
  emailFromName?: string | null
  emailFromAddress?: string | null
  
  // SMS
  smsNotificationsEnabled: boolean
  twilioAccountSid?: string | null
  twilioAuthToken?: string | null
  twilioPhoneNumber?: string | null
  
  // Paramètres par statut
  notifyOnConfirmed: boolean
  notifyOnPreparing: boolean
  notifyOnReady: boolean
  notifyOnDelivering: boolean
  notifyOnCompleted: boolean
  notifyOnCancelled: boolean
  notifyOnPaymentFailed: boolean
}

export class NotificationService {
  private settings: NotificationSettings | null = null
  private emailTransporter: nodemailer.Transporter | null = null
  private twilioClient: twilio.Twilio | null = null

  // Initialise le service avec les paramètres de la base
  async initialize(): Promise<void> {
    try {
      const dbSettings = await prisma.settings.findFirst({
        select: {
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPassword: true,
          emailFromName: true,
          emailFromAddress: true,
          smsNotificationsEnabled: true,
          twilioAccountSid: true,
          twilioAuthToken: true,
          twilioPhoneNumber: true,
          notifyOnConfirmed: true,
          notifyOnPreparing: true,
          notifyOnReady: true,
          notifyOnDelivering: true,
          notifyOnCompleted: true,
          notifyOnCancelled: true,
          notifyOnPaymentFailed: true,
        }
      })

      if (!dbSettings) {
        console.warn('Aucune configuration de notifications trouvée')
        return
      }

      this.settings = dbSettings
      await this.setupEmailTransporter()
      await this.setupTwilioClient()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de notifications:', error)
    }
  }

  // Configure le transporteur email
  private async setupEmailTransporter(): Promise<void> {
    if (!this.settings?.emailNotificationsEnabled) return

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword } = this.settings

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('Configuration email incomplète')
      return
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })

      // Test de la connexion
      await this.emailTransporter.verify()
      console.log('✅ Transporteur email configuré avec succès')
    } catch (error) {
      console.error('❌ Erreur configuration email:', error)
      this.emailTransporter = null
    }
  }

  // Configure le client Twilio
  private async setupTwilioClient(): Promise<void> {
    if (!this.settings?.smsNotificationsEnabled) return

    const { twilioAccountSid, twilioAuthToken } = this.settings

    if (!twilioAccountSid || !twilioAuthToken) {
      console.warn('Configuration Twilio incomplète')
      return
    }

    try {
      this.twilioClient = twilio(twilioAccountSid, twilioAuthToken)
      console.log('✅ Client Twilio configuré avec succès')
    } catch (error) {
      console.error('❌ Erreur configuration Twilio:', error)
      this.twilioClient = null
    }
  }

  // Vérifie si les notifications sont activées pour un statut
  private shouldNotifyForStatus(status: OrderStatus): boolean {
    if (!this.settings?.notificationsEnabled) return false

    const statusNotificationMap: Record<OrderStatus, keyof NotificationSettings> = {
      confirmed: 'notifyOnConfirmed',
      preparing: 'notifyOnPreparing',
      ready: 'notifyOnReady',
      delivering: 'notifyOnDelivering',
      completed: 'notifyOnCompleted',
      cancelled: 'notifyOnCancelled',
      payment_failed: 'notifyOnPaymentFailed',
      pending: 'notifyOnConfirmed' // Pas de notification pour pending
    }

    const settingKey = statusNotificationMap[status]
    return settingKey ? Boolean(this.settings[settingKey]) : false
  }

  // Envoie une notification email
  async sendEmailNotification(notification: OrderNotification): Promise<{ success: boolean; error?: string }> {
    if (!this.emailTransporter || !this.settings?.emailNotificationsEnabled) {
      return { success: false, error: 'Email non configuré' }
    }

    if (!this.shouldNotifyForStatus(notification.status)) {
      return { success: false, error: 'Notifications désactivées pour ce statut' }
    }

    try {
      const statusConfig = ORDER_STATUS_CONFIG[notification.status]
      const subject = `${this.settings.emailFromName} - ${statusConfig.label}`

      const htmlContent = this.generateEmailHTML(notification)

      const mailOptions = {
        from: `"${this.settings.emailFromName}" <${this.settings.emailFromAddress}>`,
        to: notification.recipient,
        subject,
        text: notification.message,
        html: htmlContent,
      }

      const result = await this.emailTransporter.sendMail(mailOptions)
      console.log(`📧 Email envoyé avec succès à ${notification.recipient}:`, result.messageId)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur envoi email:', error)
      return { success: false, error: String(error) }
    }
  }

  // Envoie une notification SMS
  async sendSMSNotification(notification: OrderNotification): Promise<{ success: boolean; error?: string }> {
    if (!this.twilioClient || !this.settings?.smsNotificationsEnabled) {
      return { success: false, error: 'SMS non configuré' }
    }

    if (!this.shouldNotifyForStatus(notification.status)) {
      return { success: false, error: 'Notifications désactivées pour ce statut' }
    }

    if (!this.settings.twilioPhoneNumber) {
      return { success: false, error: 'Numéro Twilio non configuré' }
    }

    try {
      // Formater le numéro de téléphone (s'assurer qu'il commence par +)
      let toNumber = notification.recipient
      if (!toNumber.startsWith('+')) {
        toNumber = '+33' + toNumber.replace(/^0/, '')
      }

      const message = await this.twilioClient.messages.create({
        body: notification.message,
        from: this.settings.twilioPhoneNumber,
        to: toNumber,
      })

      console.log(`📱 SMS envoyé avec succès à ${toNumber}:`, message.sid)
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error)
      return { success: false, error: String(error) }
    }
  }

  // Génère le HTML pour l'email
  private generateEmailHTML(notification: OrderNotification): string {
    const statusConfig = ORDER_STATUS_CONFIG[notification.status]
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusConfig.label}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #EA580C 0%, #DC2626 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
        .status-${notification.status} { background-color: ${statusConfig.color.includes('yellow') ? '#FEF3C7' : statusConfig.color.includes('blue') ? '#DBEAFE' : statusConfig.color.includes('green') ? '#D1FAE5' : statusConfig.color.includes('orange') ? '#FED7AA' : statusConfig.color.includes('red') ? '#FEE2E2' : '#F3F4F6'}; color: ${statusConfig.color.includes('yellow') ? '#92400E' : statusConfig.color.includes('blue') ? '#1E40AF' : statusConfig.color.includes('green') ? '#047857' : statusConfig.color.includes('orange') ? '#C2410C' : statusConfig.color.includes('red') ? '#DC2626' : '#374151'}; }
        .message { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 30px; }
        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 14px; color: #6B7280; }
        .pizza-emoji { font-size: 24px; margin-right: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="pizza-emoji">🍕</span>${this.settings?.emailFromName || 'Bella Pizza'}</h1>
        </div>
        <div class="content">
          <div class="status-badge status-${notification.status}">
            ${statusConfig.label}
          </div>
          <div class="message">
            ${notification.message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div class="footer">
          <p>Merci de votre confiance !</p>
          <p>L'équipe ${this.settings?.emailFromName || 'Bella Pizza'}</p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  // Test la configuration email
  async testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize()
      
      if (!this.emailTransporter) {
        return { success: false, error: 'Configuration email manquante ou invalide' }
      }

      await this.emailTransporter.verify()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Test la configuration SMS
  async testSMSConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize()
      
      if (!this.twilioClient || !this.settings?.twilioPhoneNumber) {
        return { success: false, error: 'Configuration Twilio manquante ou invalide' }
      }

      // Test en récupérant les informations du compte
      await this.twilioClient.api.accounts(this.settings.twilioAccountSid!).fetch()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Envoie toutes les notifications d'une liste
  async sendAllNotifications(notifications: OrderNotification[]): Promise<{
    emailResults: Array<{ success: boolean; error?: string }>
    smsResults: Array<{ success: boolean; error?: string }>
  }> {
    const emailResults: Array<{ success: boolean; error?: string }> = []
    const smsResults: Array<{ success: boolean; error?: string }> = []

    for (const notification of notifications) {
      if (notification.type === 'email') {
        const result = await this.sendEmailNotification(notification)
        emailResults.push(result)
      } else if (notification.type === 'sms') {
        const result = await this.sendSMSNotification(notification)
        smsResults.push(result)
      }
    }

    return { emailResults, smsResults }
  }
}

// Instance singleton
export const notificationService = new NotificationService() 