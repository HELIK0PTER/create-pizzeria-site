import { NextResponse } from "next/server";
import { Stripe } from "stripe";

// Vérifier si la clé Stripe est configurée
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY n'est pas configurée. Le paiement Stripe ne fonctionnera pas.");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    })
  : null;

export async function POST(req: Request) {
  try {
    // Vérifier si Stripe est configuré
    if (!stripe) {
      return NextResponse.json(
        { error: "Service de paiement non configuré" },
        { status: 503 }
      );
    }

    // Récupérer les articles du panier, le mode de livraison et les informations client depuis le corps de la requête
    const { items, deliveryMethod, deliveryFee, customerInfo, promotionData } =
      await req.json();

    // Vérifier si le panier est vide
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Le panier est vide" },
        { status: 400 }
      );
    }

    // Transformer les articles du panier au format attendu par Stripe
    const line_items = items.map(
      (item: {
        product: {
          id: string;
          name: string;
          description: string;
          image: string;
          price: number;
        };
        variant?: { id: string; name: string; price: number } | null;
        quantity: number;
      }) => {
        const unit_amount = Math.round(
          (item.product.price + (item.variant?.price || 0)) * 100
        ); // Convertir en centimes

        return {
          price_data: {
            currency: "eur", // ou votre devise
            product_data: {
              name: item.product.name,
              description:
                item.variant?.name || item.product.description || undefined,
              images: item.product.image ? [item.product.image] : undefined,
              metadata: {
                productId: item.product.id,
                ...(item.variant?.id && { variantId: item.variant.id }),
              },
            },
            unit_amount: unit_amount,
          },
          quantity: item.quantity,
        };
      }
    );

    // Ajouter les frais de livraison comme un article si la livraison est sélectionnée
    if (deliveryMethod === "delivery" && deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: "eur", // ou votre devise
          product_data: {
            name: "Frais de livraison",
            description: "Coût de la livraison à domicile",
          },
          unit_amount: Math.round(deliveryFee * 100), // Convertir en centimes
        },
        quantity: 1,
      });
    }

    // Préparer les options de la session Stripe
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cart?canceled=true`,
      metadata: {
        deliveryMethod: deliveryMethod,
        deliveryFee: deliveryFee ? String(deliveryFee) : "0",
      },
    };

    // Créer un customer avec les informations pré-remplies si disponibles
    let customerId: string | undefined;
    if (customerInfo && customerInfo.email && customerInfo.email.trim() !== "") {
      try {
        const customerData: Stripe.CustomerCreateParams = {
          email: customerInfo.email,
          name: `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim() || undefined,
          phone: customerInfo.phone || undefined,
        };

        // Ajouter l'adresse pour pré-remplir l'adresse de livraison
        if (deliveryMethod === "delivery" && customerInfo.address && customerInfo.city && customerInfo.postalCode) {
          customerData.shipping = {
            name: `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim(),
            phone: customerInfo.phone || undefined,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              postal_code: customerInfo.postalCode,
              country: "FR",
            },
          };
        }

        const customer = await stripe.customers.create(customerData);
        customerId = customer.id;
      } catch (error) {
        console.warn("Erreur lors de la création du customer:", error);
        // Continue sans customer si ça échoue
      }
    }

    // Utiliser le customer créé ou fallback sur email simple
    if (customerId) {
      sessionOptions.customer = customerId;
    } else if (customerInfo?.email && customerInfo.email.trim() !== "") {
      sessionOptions.customer_email = customerInfo.email;
    }

    // Configuration pour la livraison
    if (deliveryMethod === "delivery") {
      sessionOptions.shipping_address_collection = {
        allowed_countries: ["FR"],
      };
    }

    // Ajouter toutes les informations dans les métadonnées pour récupération après paiement
    if (customerInfo && sessionOptions.metadata) {
      sessionOptions.metadata.customer_first_name = customerInfo.firstName || "";
      sessionOptions.metadata.customer_last_name = customerInfo.lastName || "";
      sessionOptions.metadata.customer_full_name = `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim();
      sessionOptions.metadata.customer_phone = customerInfo.phone || "";
      sessionOptions.metadata.customer_email = customerInfo.email || "";
      
      if (deliveryMethod === "delivery") {
        sessionOptions.metadata.shipping_address = customerInfo.address || "";
        sessionOptions.metadata.shipping_city = customerInfo.city || "";
        sessionOptions.metadata.shipping_postal_code = customerInfo.postalCode || "";
        sessionOptions.metadata.full_delivery_address = `${customerInfo.address || ""}, ${customerInfo.postalCode || ""} ${customerInfo.city || ""}`.trim();
      }
      
      if (customerInfo.notes) {
        sessionOptions.metadata.customer_notes = customerInfo.notes;
      }
    }

    // Ajouter les données de promotion dans les métadonnées
    if (promotionData && sessionOptions.metadata) {
      sessionOptions.metadata.promotion_applied = promotionData.applied ? "true" : "false";
      sessionOptions.metadata.promotion_discount = String(promotionData.discount || 0);
      sessionOptions.metadata.original_subtotal = String(promotionData.originalSubTotal || 0);
      sessionOptions.metadata.promotion_type = promotionData.type || "";
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Retourner l'ID de la session
    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement:",
      error
    );
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
