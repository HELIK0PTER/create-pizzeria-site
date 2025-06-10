"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Send,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Settings,
  Bell,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationSettings {
  // Général
  notificationsEnabled: boolean;

  // Email
  emailNotificationsEnabled: boolean;
  smtpHost?: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  emailFromName?: string | null;
  emailFromAddress?: string | null;

  // SMS
  smsNotificationsEnabled: boolean;
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  twilioPhoneNumber?: string | null;

  // Paramètres par statut
  notifyOnConfirmed: boolean;
  notifyOnPreparing: boolean;
  notifyOnReady: boolean;
  notifyOnDelivering: boolean;
  notifyOnCompleted: boolean;
  notifyOnCancelled: boolean;
  notifyOnPaymentFailed: boolean;
}

export default function AdminNotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error("Erreur lors du chargement des paramètres");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (
    key: keyof NotificationSettings,
    value: string | number | boolean
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Paramètres sauvegardés avec succès");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch("/api/test-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email" }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Configuration email testée avec succès !");
      } else {
        toast.error(`Erreur test email: ${result.error}`);
      }
    } catch {
      toast.error("Erreur lors du test");
    } finally {
      setTestingEmail(false);
    }
  };

  const testSMSConfiguration = async () => {
    setTestingSMS(true);
    try {
      const response = await fetch("/api/test-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sms" }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Configuration SMS testée avec succès !");
      } else {
        toast.error(`Erreur test SMS: ${result.error}`);
      }
    } catch {
      toast.error("Erreur lors du test");
    } finally {
      setTestingSMS(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {`Impossible de charger les paramètres de notification.`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bell className="h-8 w-8 text-orange-600" />
          {`Configuration des Notifications`}
        </h1>
        <p className="text-gray-600">
          {`Configurez l'envoi d'emails et de SMS pour tenir vos clients informés.`}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="statuses">Statuts</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {`Paramètres Généraux`}
              </CardTitle>
              <CardDescription>
                {`Activez ou désactivez les notifications globalement.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    {`Notifications activées`}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {`Active ou désactive toutes les notifications automatiques.`}
                  </p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("notificationsEnabled", checked)
                  }
                />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {`Notifications Email`}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {`Envoi d'emails aux clients`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        settings.emailNotificationsEnabled
                          ? "default"
                          : "secondary"
                      }
                    >
                      {settings.emailNotificationsEnabled
                        ? "Activé"
                        : "Désactivé"}
                    </Badge>
                    <Switch
                      checked={settings.emailNotificationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("emailNotificationsEnabled", checked)
                      }
                      disabled={!settings.notificationsEnabled}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {`Notifications SMS`}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {`Envoi de SMS aux clients`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        settings.smsNotificationsEnabled
                          ? "default"
                          : "secondary"
                      }
                    >
                      {settings.smsNotificationsEnabled
                        ? "Activé"
                        : "Désactivé"}
                    </Badge>
                    <Switch
                      checked={settings.smsNotificationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("smsNotificationsEnabled", checked)
                      }
                      disabled={!settings.notificationsEnabled}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {`Configuration Email (Nodemailer)`}
              </CardTitle>
              <CardDescription>
                {`Configurez les paramètres SMTP pour l'envoi d'emails.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">{`Serveur SMTP`}</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost || ""}
                    onChange={(e) => updateSetting("smtpHost", e.target.value)}
                    placeholder="smtp.gmail.com"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">{`Port SMTP`}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) =>
                      updateSetting("smtpPort", parseInt(e.target.value) || 587)
                    }
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtpSecure"
                  checked={settings.smtpSecure}
                  onCheckedChange={(checked) =>
                    updateSetting("smtpSecure", checked)
                  }
                  disabled={!settings.emailNotificationsEnabled}
                />
                <Label htmlFor="smtpSecure">
                  {`Connexion sécurisée (SSL/TLS pour port 465)`}
                </Label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">{`Email d'envoi`}</Label>
                  <Input
                    id="smtpUser"
                    type="email"
                    value={settings.smtpUser || ""}
                    onChange={(e) => updateSetting("smtpUser", e.target.value)}
                    placeholder="votre-email@gmail.com"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">{`Mot de passe / App Password`}</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showSmtpPassword ? "text" : "password"}
                      value={settings.smtpPassword || ""}
                      onChange={(e) =>
                        updateSetting("smtpPassword", e.target.value)
                      }
                      placeholder="Mot de passe"
                      disabled={!settings.emailNotificationsEnabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailFromName">{`Nom expéditeur`}</Label>
                  <Input
                    id="emailFromName"
                    value={settings.emailFromName || ""}
                    onChange={(e) =>
                      updateSetting("emailFromName", e.target.value)
                    }
                    placeholder="Bella Pizza"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
                <div>
                  <Label htmlFor="emailFromAddress">{`Email expéditeur`}</Label>
                  <Input
                    id="emailFromAddress"
                    type="email"
                    value={settings.emailFromAddress || ""}
                    onChange={(e) =>
                      updateSetting("emailFromAddress", e.target.value)
                    }
                    placeholder="notifications@bellapizza.fr"
                    disabled={!settings.emailNotificationsEnabled}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={testEmailConfiguration}
                  disabled={!settings.emailNotificationsEnabled || testingEmail}
                  variant="outline"
                >
                  {testingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {`Tester la configuration`}
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {`Pour Gmail, utilisez un "App Password" plutôt que votre mot de passe habituel. 
                  Activez l'authentification à 2 facteurs puis générez un App Password dans vos paramètres Google.`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {`Configuration SMS (Twilio)`}
              </CardTitle>
              <CardDescription>
                {`Configurez Twilio pour l'envoi de SMS.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twilioAccountSid">{`Account SID`}</Label>
                  <Input
                    id="twilioAccountSid"
                    value={settings.twilioAccountSid || ""}
                    onChange={(e) =>
                      updateSetting("twilioAccountSid", e.target.value)
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    disabled={!settings.smsNotificationsEnabled}
                  />
                </div>
                <div>
                  <Label htmlFor="twilioAuthToken">{`Auth Token`}</Label>
                  <div className="relative">
                    <Input
                      id="twilioAuthToken"
                      type={showTwilioToken ? "text" : "password"}
                      value={settings.twilioAuthToken || ""}
                      onChange={(e) =>
                        updateSetting("twilioAuthToken", e.target.value)
                      }
                      placeholder="Token d'authentification"
                      disabled={!settings.smsNotificationsEnabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowTwilioToken(!showTwilioToken)}
                    >
                      {showTwilioToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="twilioPhoneNumber">{`Numéro Twilio`}</Label>
                <Input
                  id="twilioPhoneNumber"
                  value={settings.twilioPhoneNumber || ""}
                  onChange={(e) =>
                    updateSetting("twilioPhoneNumber", e.target.value)
                  }
                  placeholder="+33123456789"
                  disabled={!settings.smsNotificationsEnabled}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {`Format international requis (ex: +33123456789)`}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={testSMSConfiguration}
                  disabled={!settings.smsNotificationsEnabled || testingSMS}
                  variant="outline"
                >
                  {testingSMS ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {`Tester la configuration`}
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {`Vous devez créer un compte Twilio et acheter un numéro de téléphone pour pouvoir envoyer des SMS. 
                  Coût approximatif : 1€/mois pour le numéro + environ 0.05€ par SMS envoyé.`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statuts */}
        <TabsContent value="statuses">
          <Card>
            <CardHeader>
              <CardTitle>{`Notifications par Statut`}</CardTitle>
              <CardDescription>
                {`Choisissez quels changements de statut déclenchent des notifications.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "notifyOnConfirmed",
                  label: "Commande confirmée",
                  description: "Quand le paiement est validé",
                },
                {
                  key: "notifyOnPreparing",
                  label: "En préparation",
                  description: "Quand la cuisine commence la commande",
                },
                {
                  key: "notifyOnReady",
                  label: "Commande prête",
                  description: "Quand la commande est terminée",
                },
                {
                  key: "notifyOnDelivering",
                  label: "En livraison",
                  description: "Quand le livreur part (livraison uniquement)",
                },
                {
                  key: "notifyOnCompleted",
                  label: "Commande terminée",
                  description: "Quand la commande est livrée/récupérée",
                },
                {
                  key: "notifyOnCancelled",
                  label: "Commande annulée",
                  description: "En cas d'annulation",
                },
                {
                  key: "notifyOnPaymentFailed",
                  label: "Échec de paiement",
                  description: "En cas de problème de paiement",
                },
              ].map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <Label className="text-base font-medium">{label}</Label>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <Switch
                    checked={
                      settings[key as keyof NotificationSettings] as boolean
                    }
                    onCheckedChange={(checked) =>
                      updateSetting(key as keyof NotificationSettings, checked)
                    }
                    disabled={!settings.notificationsEnabled}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {`Sauvegarder les paramètres`}
        </Button>
      </div>
    </div>
  );
}
