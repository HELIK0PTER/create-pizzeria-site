"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, usePromotionSettings } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CreditCard, X, Gift } from "lucide-react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";
import { Checkbox } from "@/components/ui/checkbox";

// Chargez votre clé publique Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface AddressForm {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  notes?: string;
}

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    favouriteAddress?: {
      id: string;
      name: string;
      street: string;
      city: string;
      postalCode: string;
    };
    orders: Array<{
      id: string;
      customerName: string;
      customerEmail?: string;
      customerPhone: string;
      deliveryAddress?: string;
      createdAt: string;
    }>;
  };
}

// Fonction pour sauvegarder en localStorage
const saveToLocalStorage = (data: AddressForm) => {
  try {
    localStorage.setItem('checkoutData', JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde en localStorage:', error);
  }
};

// Fonction pour charger depuis localStorage
const loadFromLocalStorage = (): Partial<AddressForm> | null => {
  try {
    const saved = localStorage.getItem('checkoutData');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Erreur lors du chargement depuis localStorage:', error);
    return null;
  }
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    items,
    getSubTotal,
    getTotal,
    getPromotionApplied,
    getPromotionDiscount,
    deliveryMethod,
    deliveryFee,
  } = useCart();

  // Charger les settings de promotion
  usePromotionSettings();

  const promotionApplied = getPromotionApplied();
  const promotionDiscount = getPromotionDiscount();

  const [addressForm, setAddressForm] = useState<AddressForm>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [saveForNextTime, setSaveForNextTime] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Charger les données utilisateur si connecté
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return;
      
      setIsLoadingUserData(true);
      try {
        const response = await fetch("/api/session/current");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          
          // Si l'utilisateur vient de se connecter, effacer les données localStorage
          // car on va utiliser ses données de compte
          try {
            localStorage.removeItem('checkoutData');
          } catch (error) {
            console.error('Erreur lors de la suppression des données localStorage:', error);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur:", error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [session]);

  // Préremplir le formulaire selon la logique demandée
  useEffect(() => {
    let dataToFill: Partial<AddressForm> = {};

    if (userData?.user) {
      // Utilisateur connecté
      const user = userData.user;
      
      // Données de base de l'utilisateur
      const [firstName = "", lastName = ""] = user.name.split(" ", 2);
      dataToFill = {
        firstName,
        lastName: lastName || "",
        email: user.email,
        phone: user.phone || "",
      };

      // Si il a une adresse préférée et qu'on est en mode livraison
      if (deliveryMethod === "delivery" && user.favouriteAddress) {
        dataToFill = {
          ...dataToFill,
          address: user.favouriteAddress.street,
          city: user.favouriteAddress.city,
          postalCode: user.favouriteAddress.postalCode,
        };
      } else if (deliveryMethod === "delivery" && user.orders && user.orders.length > 0) {
        // Sinon, utiliser les infos de la dernière commande
        const lastOrder = user.orders[0];
        const [orderFirstName = "", orderLastName = ""] = lastOrder.customerName.split(" ", 2);
        
        dataToFill = {
          ...dataToFill,
          firstName: orderFirstName,
          lastName: orderLastName || "",
          phone: lastOrder.customerPhone,
        };

        if (lastOrder.customerEmail) {
          dataToFill.email = lastOrder.customerEmail;
        }

        if (lastOrder.deliveryAddress) {
          // Essayer de parser l'adresse de livraison (format libre, on fait de notre mieux)
          dataToFill.address = lastOrder.deliveryAddress;
        }
      }
    } else {
      // Pas d'utilisateur connecté, charger depuis localStorage
      const savedData = loadFromLocalStorage();
      if (savedData) {
        dataToFill = savedData;
      }
    }

    // Mettre à jour le formulaire avec les données trouvées
    setAddressForm(prev => ({
      ...prev,
      ...dataToFill
    }));
  }, [userData, deliveryMethod]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid = () => {
    // L'email n'est plus obligatoire
    const requiredFields = ["firstName", "lastName", "phone"];
    if (deliveryMethod === "delivery") {
      requiredFields.push("address", "city", "postalCode");
    }
    return requiredFields.every((field) => {
      const value = addressForm[field as keyof AddressForm];
      return value && value.trim() !== "";
    });
  };

  const handleConfirmAndPay = async () => {
    if (!isFormValid()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Sauvegarder en localStorage si demandé et pas d'utilisateur connecté
    if (saveForNextTime && !userData?.user) {
      saveToLocalStorage(addressForm);
    }

    setIsProcessing(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Erreur: Service de paiement non disponible");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          deliveryMethod,
          deliveryFee,
          customerInfo: addressForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de la session de paiement"
        );
      }

      const session = await response.json();

      // Rediriger l'utilisateur vers la page de paiement Stripe
      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors du paiement");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push("/cart");
  };

  if (items.length === 0) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {`Votre panier est vide`}
          </h1>
          <p className="text-gray-600 mb-8">
            {`Ajoutez des articles à votre panier pour procéder à la commande.`}
          </p>
          <Button onClick={() => router.push("/menu")}>
            {`Voir la carte`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {`Retour`}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {`Finaliser la commande`}
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <X className="h-4 w-4" />
            <AlertTitle>{`Erreur`}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulaire d'adresse */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {deliveryMethod === "delivery"
                    ? `Adresse de livraison`
                    : `Informations de contact`}
                </CardTitle>
                {isLoadingUserData && (
                  <p className="text-sm text-gray-600">
                    {`Chargement de vos informations...`}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{`Prénom *`}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={addressForm.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{`Nom *`}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={addressForm.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">{`Email (optionnel)`}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={addressForm.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{`Téléphone *`}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={addressForm.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {deliveryMethod === "delivery" && (
                  <>
                    <div>
                      <Label htmlFor="address">{`Adresse *`}</Label>
                      <Input
                        id="address"
                        name="address"
                        value={addressForm.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">{`Ville *`}</Label>
                        <Input
                          id="city"
                          name="city"
                          value={addressForm.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">{`Code postal *`}</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={addressForm.postalCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="notes">{`Notes spéciales (optionnel)`}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={addressForm.notes}
                    onChange={handleInputChange}
                    placeholder={`Instructions de livraison, allergies, etc.`}
                  />
                </div>

                {/* Checkbox pour sauvegarder les infos - seulement si pas d'utilisateur connecté */}
                {!userData?.user && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveForNextTime"
                      checked={saveForNextTime}
                      onCheckedChange={(checked) => setSaveForNextTime(checked as boolean)}
                    />
                    <Label htmlFor="saveForNextTime" className="text-sm">
                      {`Enregistrer ces informations pour les prochaines commandes`}
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Résumé de la commande */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{`Résumé de la commande`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Liste des articles */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const basePrice = item.product.price;
                      const variantPrice = item.variant?.price || 0;
                      const totalPrice = basePrice + variantPrice;
                      return (
                        <div
                          key={`${item.productId}-${item.variantId}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                width={48}
                                height={48}
                                className="rounded"
                              />
                            ) : (
                              <span className="text-lg">🍕</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            {item.variant && (
                              <p className="text-sm text-gray-600">
                                {item.variant.name}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              {`Quantité: ${item.quantity}`}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatPrice(totalPrice * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>{`Mode de livraison:`}</span>
                      <span>
                        {deliveryMethod === "delivery"
                          ? `Livraison à domicile`
                          : `Retrait sur place`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{`Sous-total`}</span>
                      <span>{formatPrice(getSubTotal())}</span>
                    </div>
                    
                    {/* Affichage de la promotion */}
                    {promotionApplied && promotionDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Gift className="h-4 w-4" />
                          {`Promotion ${promotionApplied.type === 'delivery' ? 'livraison' : 'retrait'}`}
                        </span>
                        <span>{`-${formatPrice(promotionDiscount)}`}</span>
                      </div>
                    )}
                    
                    {deliveryMethod === "delivery" && (
                      <div className="flex justify-between">
                        <span>{`Frais de livraison`}</span>
                        <span>{formatPrice(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>{`Total`}</span>
                      <span className="text-red-600">
                        {formatPrice(getTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {`Annuler`}
                </Button>
                <Button
                  onClick={handleConfirmAndPay}
                  disabled={!isFormValid() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    `Traitement...`
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {`Confirmer et régler`}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
