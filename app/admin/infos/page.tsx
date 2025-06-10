'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Save,
  Clock,
  Truck,
  CreditCard,
  Palette,
  Share2,
  Info,
  CheckCircle2,
  AlertCircle,
  Euro,
  Gift
} from 'lucide-react'
import { variables } from '@/settings/config'
interface Settings {
  id?: string
  name: string
  slogan?: string
  logo?: string
  phone: string
  email: string
  address: string
  openingHours?: Record<string, { open: string, close: string, closed: boolean }>
  isOpen: boolean
  closedMessage?: string
  clickAndCollectEnabled: boolean
  deliveryEnabled: boolean
  deliveryZone?: string[]
  deliveryFee: number
  freeDeliveryThreshold?: number
  minOrderAmount: number
  deliveryTime: string
  preparationTime: string
  pickupInstructions?: string
  cashEnabled: boolean
  cardEnabled: boolean
  onlinePaymentEnabled: boolean
  cashMaxAmount?: number
  ticketsRestaurantEnabled: boolean
  checkEnabled: boolean
  facebookUrl?: string
  instagramUrl?: string
  websiteUrl?: string
  welcomeMessage?: string
  specialAnnouncement?: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  headerImage?: string
  adminEmail: string
  orderNotificationEmail: boolean
  
  // Champs de promotion
  promotionsEnabled: boolean
  deliveryPromotionEnabled: boolean
  deliveryPromotionBuy: number
  deliveryPromotionGet: number
  pickupPromotionEnabled: boolean
  pickupPromotionBuy: number
  pickupPromotionGet: number
  promotionDescription: string
  
  // Champs de temps d'attente et messages personnalisés
  deliveryWaitTimeMin: number
  deliveryWaitTimeMax: number
  pickupWaitTimeMin: number
  pickupWaitTimeMax: number
  orderSuccessMessage: string
}

const defaultOpeningHours = {
  monday: { open: "11:00", close: "22:00", closed: false },
  tuesday: { open: "11:00", close: "22:00", closed: false },
  wednesday: { open: "11:00", close: "22:00", closed: false },
  thursday: { open: "11:00", close: "22:00", closed: false },
  friday: { open: "11:00", close: "23:00", closed: false },
  saturday: { open: "11:00", close: "23:00", closed: false },
  sunday: { open: "18:00", close: "22:00", closed: false }
}

const days = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
]

export default function AdminInfosPage() {
  const [settings, setSettings] = useState<Settings>({
    name: '',
    phone: '',
    email: '',
    address: '',
    isOpen: true,
    clickAndCollectEnabled: true,
    deliveryEnabled: true,
    deliveryFee: 3.50,
    minOrderAmount: 15.00,
    deliveryTime: '30-45 min',
    preparationTime: '15-20 min',
    cashEnabled: true,
    cardEnabled: true,
    onlinePaymentEnabled: true,
    ticketsRestaurantEnabled: true,
    checkEnabled: false,
    primaryColor: '#EA580C',
    secondaryColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    adminEmail: '',
    orderNotificationEmail: true,
    
    // Champs de promotion
    promotionsEnabled: false,
    deliveryPromotionEnabled: false,
    deliveryPromotionBuy: 2,
    deliveryPromotionGet: 1,
    pickupPromotionEnabled: false,
    pickupPromotionBuy: 1,
    pickupPromotionGet: 1,
    promotionDescription: 'Promotions sur les pizzas !',
    
    // Champs de temps d'attente et messages personnalisés
    deliveryWaitTimeMin: 0,
    deliveryWaitTimeMax: 0,
    pickupWaitTimeMin: 0,
    pickupWaitTimeMax: 0,
    orderSuccessMessage: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deliveryZoneInput, setDeliveryZoneInput] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          ...data,
          openingHours: data.openingHours || defaultOpeningHours
        })
        if (data.deliveryZone) {
          setDeliveryZoneInput(data.deliveryZone.join(', '))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const dataToSave = {
        ...settings,
        deliveryZone: deliveryZoneInput.split(',').map(zone => zone.trim()).filter(zone => zone)
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion : ' + String(error) })
    } finally {
      setSaving(false)
    }
  }

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          open: "11:00",
          close: "22:00",
          closed: false,
          ...prev.openingHours?.[day],
          [field]: value
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informations de la pizzeria</h1>
          <p className="text-gray-600">Gérez les paramètres de votre établissement</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-fit">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="horaires" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horaires
          </TabsTrigger>
          <TabsTrigger value="livraison" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="paiements" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="apparence" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
              <CardDescription>Nom, contact et adresse de votre pizzeria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la pizzeria</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={variables.title}
                  />
                </div>
                <div>
                  <Label htmlFor="slogan">Slogan (optionnel)</Label>
                  <Input
                    id="slogan"
                    value={settings.slogan || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, slogan: e.target.value }))}
                    placeholder="Les meilleures pizzas de la ville"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@bellapizza.fr"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse complète</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Rue de la Pizza, 75001 Paris"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminEmail">Email administrateur</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@bellapizza.fr"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="orderNotifications"
                    checked={settings.orderNotificationEmail}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, orderNotificationEmail: checked }))}
                  />
                  <Label htmlFor="orderNotifications">Notifications de commandes</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status de l&apos;établissement</CardTitle>
              <CardDescription>Gérez l&apos;ouverture/fermeture de votre pizzeria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOpen"
                  checked={settings.isOpen}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isOpen: checked }))}
                />
                <Label htmlFor="isOpen">Établissement ouvert</Label>
                <Badge variant={settings.isOpen ? "default" : "destructive"}>
                  {settings.isOpen ? "Ouvert" : "Fermé"}
                </Badge>
              </div>

              <div>
                <Label htmlFor="closedMessage">Message de fermeture</Label>
                <Input
                  id="closedMessage"
                  value={settings.closedMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, closedMessage: e.target.value }))}
                  placeholder="Nous sommes actuellement fermés"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Horaires */}
        <TabsContent value="horaires" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horaires d&apos;ouverture</CardTitle>
              <CardDescription>Définissez vos horaires pour chaque jour de la semaine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {days.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-20">
                    <Label className="font-medium">{label}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!settings.openingHours?.[key]?.closed}
                      onCheckedChange={(checked) => updateOpeningHours(key, 'closed', !checked)}
                    />
                    <Label className="text-sm">Ouvert</Label>
                  </div>

                  {!settings.openingHours?.[key]?.closed && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">De</Label>
                        <Input
                          type="time"
                          value={settings.openingHours?.[key]?.open || '11:00'}
                          onChange={(e) => updateOpeningHours(key, 'open', e.target.value)}
                          className="w-20"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">À</Label>
                        <Input
                          type="time"
                          value={settings.openingHours?.[key]?.close || '22:00'}
                          onChange={(e) => updateOpeningHours(key, 'close', e.target.value)}
                          className="w-20"
                        />
                      </div>
                    </>
                  )}

                  {settings.openingHours?.[key]?.closed && (
                    <Badge variant="outline" className="text-gray-500">Fermé</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Livraison */}
        <TabsContent value="livraison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services disponibles</CardTitle>
              <CardDescription>Activez ou désactivez vos services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="delivery"
                    checked={settings.deliveryEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, deliveryEnabled: checked }))}
                  />
                  <Label htmlFor="delivery">Livraison à domicile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="clickCollect"
                    checked={settings.clickAndCollectEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, clickAndCollectEnabled: checked }))}
                  />
                  <Label htmlFor="clickCollect">Click & Collect</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {settings.deliveryEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de livraison</CardTitle>
                <CardDescription>Configurez votre service de livraison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deliveryZone">Zone de livraison (codes postaux séparés par des virgules)</Label>
                  <Input
                    id="deliveryZone"
                    value={deliveryZoneInput}
                    onChange={(e) => setDeliveryZoneInput(e.target.value)}
                    placeholder="75001, 75002, 75003, 75004"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deliveryFee">Frais de livraison (€)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.10"
                      value={settings.deliveryFee}
                      onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="freeDelivery">Livraison gratuite à partir de (€)</Label>
                    <Input
                      id="freeDelivery"
                      type="number"
                      step="0.10"
                      value={settings.freeDeliveryThreshold || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || undefined }))}
                      placeholder="25.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minOrder">Commande minimum (€)</Label>
                    <Input
                      id="minOrder"
                      type="number"
                      step="0.10"
                      value={settings.minOrderAmount}
                      onChange={(e) => setSettings(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryTime">Temps de livraison estimé</Label>
                  <Input
                    id="deliveryTime"
                    value={settings.deliveryTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryTime: e.target.value }))}
                    placeholder="30-45 min"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {settings.clickAndCollectEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Click & Collect</CardTitle>
                <CardDescription>Configurez votre service de retrait</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preparationTime">Temps de préparation</Label>
                  <Input
                    id="preparationTime"
                    value={settings.preparationTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, preparationTime: e.target.value }))}
                    placeholder="15-20 min"
                  />
                </div>

                <div>
                  <Label htmlFor="pickupInstructions">Instructions de retrait</Label>
                  <Textarea
                    id="pickupInstructions"
                    value={settings.pickupInstructions || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, pickupInstructions: e.target.value }))}
                    placeholder="Présentez-vous à l'accueil avec votre numéro de commande"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Paiements */}
        <TabsContent value="paiements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Moyens de paiement</CardTitle>
              <CardDescription>Configurez les options de paiement acceptées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cash"
                      checked={settings.cashEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cashEnabled: checked }))}
                    />
                    <Label htmlFor="cash">Espèces</Label>
                  </div>
                  
                  {settings.cashEnabled && (
                    <div className="ml-6">
                      <Label htmlFor="cashMax">Montant maximum en espèces (€)</Label>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-4 h-4 text-gray-500" />
                        <Input
                          id="cashMax"
                          type="number"
                          step="0.10"
                          value={settings.cashMaxAmount || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, cashMaxAmount: parseFloat(e.target.value) || undefined }))}
                          placeholder="50.00"
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">(vide = illimité)</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="card"
                      checked={settings.cardEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cardEnabled: checked }))}
                    />
                    <Label htmlFor="card">Carte bancaire sur place</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="online"
                      checked={settings.onlinePaymentEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, onlinePaymentEnabled: checked }))}
                    />
                    <Label htmlFor="online">Paiement en ligne</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tickets"
                      checked={settings.ticketsRestaurantEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, ticketsRestaurantEnabled: checked }))}
                    />
                    <Label htmlFor="tickets">Tickets restaurant</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="check"
                      checked={settings.checkEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, checkEnabled: checked }))}
                    />
                    <Label htmlFor="check">Chèques</Label>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Moyens de paiement activés :</h4>
                <div className="flex flex-wrap gap-2">
                  {settings.cashEnabled && (
                    <Badge variant="secondary">
                      Espèces {settings.cashMaxAmount && `(max ${settings.cashMaxAmount}€)`}
                    </Badge>
                  )}
                  {settings.cardEnabled && <Badge variant="secondary">Carte bancaire</Badge>}
                  {settings.onlinePaymentEnabled && <Badge variant="secondary">Paiement en ligne</Badge>}
                  {settings.ticketsRestaurantEnabled && <Badge variant="secondary">Tickets restaurant</Badge>}
                  {settings.checkEnabled && <Badge variant="secondary">Chèques</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Commandes */}
        <TabsContent value="commandes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{`Messages de confirmation de commande`}</CardTitle>
              <CardDescription>{`Configurez les messages personnalisés après validation d'une commande`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="orderSuccessMessage">{`Message de confirmation personnalisé`}</Label>
                <Input
                  id="orderSuccessMessage"
                  value={settings.orderSuccessMessage}
                  onChange={(e) => setSettings(prev => ({ ...prev, orderSuccessMessage: e.target.value }))}
                  placeholder={`Merci pour votre commande !`}
                />
                <p className="text-sm text-gray-500 mt-1">{`Ce message s'affichera sur la page de confirmation après paiement`}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{`Temps d'attente pour la livraison`}</CardTitle>
              <CardDescription>{`Configurez les temps d'attente estimés pour les livraisons`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryWaitTimeMin">{`Temps minimum (minutes)`}</Label>
                  <Input
                    id="deliveryWaitTimeMin"
                    type="number"
                    min="0"
                    value={settings.deliveryWaitTimeMin}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryWaitTimeMin: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryWaitTimeMax">{`Temps maximum (minutes)`}</Label>
                  <Input
                    id="deliveryWaitTimeMax"
                    type="number"
                    min="0"
                    value={settings.deliveryWaitTimeMax}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryWaitTimeMax: parseInt(e.target.value) || 45 }))}
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{`Aperçu pour la livraison :`}</span>
                </div>
                {settings.deliveryWaitTimeMin === settings.deliveryWaitTimeMax ? (
                  <p>{`"Un temps d'attente de ${settings.deliveryWaitTimeMin} min est estimé pour la livraison"`}</p>
                ) : (
                  <p>{`"Un temps d'attente de ${settings.deliveryWaitTimeMin}-${settings.deliveryWaitTimeMax} min est estimé pour la livraison"`}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{`Temps d'attente pour le click & collect`}</CardTitle>
              <CardDescription>{`Configurez les temps d'attente estimés pour le retrait en magasin`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupWaitTimeMin">{`Temps minimum (minutes)`}</Label>
                  <Input
                    id="pickupWaitTimeMin"
                    type="number"
                    min="0"
                    value={settings.pickupWaitTimeMin}
                    onChange={(e) => setSettings(prev => ({ ...prev, pickupWaitTimeMin: parseInt(e.target.value) || 15 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupWaitTimeMax">{`Temps maximum (minutes)`}</Label>
                  <Input
                    id="pickupWaitTimeMax"
                    type="number"
                    min="0"
                    value={settings.pickupWaitTimeMax}
                    onChange={(e) => setSettings(prev => ({ ...prev, pickupWaitTimeMax: parseInt(e.target.value) || 25 }))}
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600">🏪</span>
                  <span className="font-medium">{`Aperçu pour le click & collect :`}</span>
                </div>
                {settings.pickupWaitTimeMin === settings.pickupWaitTimeMax ? (
                  <p>{`"Un temps d'attente de ${settings.pickupWaitTimeMin} min est estimé pour le click & collect"`}</p>
                ) : (
                  <p>{`"Un temps d'attente de ${settings.pickupWaitTimeMin}-${settings.pickupWaitTimeMax} min est estimé pour le click & collect"`}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Communication */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages et communication</CardTitle>
              <CardDescription>Personnalisez vos messages clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcome">Message d&apos;accueil</Label>
                <Input
                  id="welcome"
                  value={settings.welcomeMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder={`Bienvenue chez ${variables.title} !`}
                />
              </div>

              <div>
                <Label htmlFor="announcement">Annonce spéciale (temporaire)</Label>
                <Textarea
                  id="announcement"
                  value={settings.specialAnnouncement || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, specialAnnouncement: e.target.value }))}
                  placeholder="Promotion en cours, fermeture exceptionnelle..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>Liens vers vos réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook">Page Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/bellapizza"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Compte Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/bellapizza"
                />
              </div>

              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={settings.websiteUrl || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://bellapizza.fr"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Apparence */}
        <TabsContent value="apparence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Couleurs du thème</CardTitle>
              <CardDescription>Personnalisez l&apos;apparence de votre site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Couleur principale</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#EA580C"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Couleur secondaire</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#FED7AA"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor">Couleur de fond</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg" style={{ backgroundColor: settings.backgroundColor }}>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: settings.primaryColor }}
                  ></div>
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: settings.secondaryColor }}
                  ></div>
                  <span className="text-sm text-gray-600">Aperçu des couleurs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Logo et images d&apos;en-tête</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">URL du logo</Label>
                <Input
                  id="logo"
                  value={settings.logo || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="headerImage">Image d&apos;en-tête</Label>
                <Input
                  id="headerImage"
                  value={settings.headerImage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, headerImage: e.target.value }))}
                  placeholder="https://example.com/header.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Promotions */}
        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{`Promotions Pizzas`}</CardTitle>
              <CardDescription>{`Configurez les promotions automatiques sur les pizzas`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activation globale */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="promotionsEnabled"
                  checked={settings.promotionsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, promotionsEnabled: checked }))}
                />
                <Label htmlFor="promotionsEnabled" className="font-medium">{`Activer les promotions`}</Label>
              </div>

              {/* Promotion Livraison */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    {`Promotion Livraison`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="deliveryPromotionEnabled"
                      checked={settings.deliveryPromotionEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, deliveryPromotionEnabled: checked }))}
                    />
                    <Label htmlFor="deliveryPromotionEnabled">{`Promotion livraison activée`}</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryPromotionBuy">{`Pizzas à acheter`}</Label>
                      <Input
                        id="deliveryPromotionBuy"
                        type="number"
                        min="1"
                        value={settings.deliveryPromotionBuy}
                        onChange={(e) => setSettings(prev => ({ ...prev, deliveryPromotionBuy: parseInt(e.target.value) || 2 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deliveryPromotionGet">{`Pizzas offertes`}</Label>
                      <Input
                        id="deliveryPromotionGet"
                        type="number"
                        min="1"
                        value={settings.deliveryPromotionGet}
                        onChange={(e) => setSettings(prev => ({ ...prev, deliveryPromotionGet: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {`Règle actuelle : ${settings.deliveryPromotionBuy} pizzas achetées = ${settings.deliveryPromotionGet} pizza${settings.deliveryPromotionGet > 1 ? 's' : ''} offerte${settings.deliveryPromotionGet > 1 ? 's' : ''}`}
                  </div>
                </CardContent>
              </Card>

              {/* Promotion Retrait */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-green-600">🏪</span>
                    {`Promotion Retrait (Click & Collect)`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pickupPromotionEnabled"
                      checked={settings.pickupPromotionEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pickupPromotionEnabled: checked }))}
                    />
                    <Label htmlFor="pickupPromotionEnabled">{`Promotion retrait activée`}</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickupPromotionBuy">{`Pizzas à acheter`}</Label>
                      <Input
                        id="pickupPromotionBuy"
                        type="number"
                        min="1"
                        value={settings.pickupPromotionBuy}
                        onChange={(e) => setSettings(prev => ({ ...prev, pickupPromotionBuy: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pickupPromotionGet">{`Pizzas offertes`}</Label>
                      <Input
                        id="pickupPromotionGet"
                        type="number"
                        min="1"
                        value={settings.pickupPromotionGet}
                        onChange={(e) => setSettings(prev => ({ ...prev, pickupPromotionGet: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {`Règle actuelle : ${settings.pickupPromotionBuy} pizza${settings.pickupPromotionBuy > 1 ? 's' : ''} achetée${settings.pickupPromotionBuy > 1 ? 's' : ''} = ${settings.pickupPromotionGet} pizza${settings.pickupPromotionGet > 1 ? 's' : ''} offerte${settings.pickupPromotionGet > 1 ? 's' : ''}`}
                  </div>
                </CardContent>
              </Card>

              {/* Description personnalisée */}
              <div>
                <Label htmlFor="promotionDescription">{`Description des promotions (affichée aux clients)`}</Label>
                <Textarea
                  id="promotionDescription"
                  value={settings.promotionDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, promotionDescription: e.target.value }))}
                  placeholder={`Profitez de nos promotions sur les pizzas !`}
                  rows={3}
                />
              </div>

              {/* Résumé des promotions */}
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">{`État des promotions :`}</h4>
                <div className="space-y-2">
                  {!settings.promotionsEnabled && (
                    <Badge variant="secondary" className="bg-gray-100">{`Promotions désactivées`}</Badge>
                  )}
                  {settings.promotionsEnabled && settings.deliveryPromotionEnabled && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {`Livraison : ${settings.deliveryPromotionBuy} + ${settings.deliveryPromotionGet} gratuite${settings.deliveryPromotionGet > 1 ? 's' : ''}`}
                    </Badge>
                  )}
                  {settings.promotionsEnabled && settings.pickupPromotionEnabled && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {`Retrait : ${settings.pickupPromotionBuy} + ${settings.pickupPromotionGet} gratuite${settings.pickupPromotionGet > 1 ? 's' : ''}`}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder tous les paramètres'}
        </Button>
      </div>
    </div>
  )
} 