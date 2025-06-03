"use client";

import { config } from "@/settings/config";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Pizza,
  Star,
  MapPin,
  Award,
  Users,
  X,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product/product-card";
import { Prisma } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
  };
}>;

const errors = [
  {
    message:
      "Accès refusé : vous n'avez pas les permissions nécessaires pour accéder à la zone d'administration.",
    type: "access_denied",
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<
    ProductWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [errorMessage, setErrorMessage] = useState({
    message: "",
    type: "",
  });

  const router = useRouter();

  const handleClearParams = useCallback(() => {
    setErrorMessage({
      message: "",
      type: "",
    });
    router.push("/", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (error) {
      const displayError = errors.find((e) => e.type === error);
      if (displayError) {
        setErrorMessage(displayError);
      }
    }

    // Effacer l'erreur après 5 secondes
    const timeout = setTimeout(() => {
      handleClearParams();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [error, router, handleClearParams]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products?category=pizzas&limit=6");
      const data = await response.json();
      setFeaturedProducts(data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Message d'erreur d'accès refusé */}
      {errorMessage.message && (
        <Alert className="fixed top-20 right-0 w-fit z-50 mx-4 mt-4 border-red-200 bg-red-50 flex items-center justify-between">
          <AlertDescription className="text-red-800">
            {errorMessage.message}
          </AlertDescription>
          <Button
            variant="link"
            className="hover:cursor-pointer"
            onClick={handleClearParams}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Hero Section avec gradient moderne */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        {/* Formes géométriques décoratives */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 pt-10 md:pt-26">
          <div className="md:grid xl:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 flex flex-col items-center text-center xl:items-start xl:text-left">
              {/* Badge avec animation */}
              {config.offers.map((offer, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="inline-block bg-orange-100 text-orange-800 text-sm px-4 py-2 rounded-md border border-orange-200 shadow-sm max-w-md h-fit"
              >
                <Link href={"/menu"}>
                    {offer.title}
                    <br />
                    {offer.description}
                  </Link>
                </Button>
              ))}

              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
                    Pizza Artisanale
                  </span>
                  <br />
                  <span className="text-gray-700">Livrée en</span>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {" "}
                    15min
                  </span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed text-pretty max-w-2xl">
                  Savourez l&apos;authenticité italienne avec nos pizzas
                  artisanales, préparées avec des ingrédients premium et cuites
                  au feu de bois.
                </p>
              </div>

              {/* Stats en ligne */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">4.9/5</span>
                  <span className="text-gray-500">(2.1k avis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">15k+</span>
                  <span className="text-gray-500">clients satisfaits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Prix</span>
                  <span className="text-gray-500">Meilleure Pizza 2024</span>
                </div>
              </div>

              {/* Boutons CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/menu">
                    Commander maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Link href="/menu">Découvrir le menu</Link>
                </Button>
              </div>

              {/* Informations de livraison */}
              <div className="w-fit flex items-center gap-4 p-4 pr-10 max-w-lg bg-white/60 backdrop-blur-sm rounded-xl border border-orange-100">
                <MapPin className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700 text-wrap">
                  {config.delivery_zone_text}
                </span>
              </div>
            </div>

            {/* Image/Illustration côté droit */}
            <div className="hidden relative lg:h-[600px] xl:flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                <div className="relative text-[300px] lg:text-[400px] opacity-80">
                  🍕
                </div>
                <div className="absolute top-10 right-10 bg-white rounded-full p-3 shadow-lg">
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-10 mb-10">
            <Link
              href="#menu"
              scroll={false}
              onClick={(e) => {
                e.preventDefault();
                const menuElement = document.getElementById("menu");
                if (menuElement) {
                  const headerOffset = 80; // Hauteur approximative du header
                  const elementPosition =
                    menuElement.getBoundingClientRect().top;
                  const offsetPosition =
                    elementPosition + window.pageYOffset - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <ArrowDown className="h-6 w-6 text-gray-500 animate-bounce" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products avec design amélioré */}
      <section
        id="menu"
        className="py-20 bg-gradient-to-br from-gray-50 to-orange-50 scroll-mt-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Nos best-sellers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Les pizzas qui font sensation
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les créations qui ont conquis le cœur de nos clients
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Aucune pizza disponible pour le moment.
              </p>
            </div>
          )}

          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Link href="/menu">
                Voir toute la carte
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section Carte Google Maps */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">
            Retrouvez-nous ici !
          </h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl">
            <iframe
              width="100%"
              height="450"
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyA0fR8fT3mG1i0Ee0rtzwaOIdyobwNVJaw&q=147+Avenue+de+la+République,+75011+Paris`}
            ></iframe>
          </div>
        </div>
      </section>

      {/* Features avec cards modernes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Pourquoi nous choisir
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              L&apos;excellence à chaque bouchée
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez ce qui fait de nous la référence de la pizza artisanale
              dans la région
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Pizza,
                title: "Ingrédients Premium",
                description:
                  "Mozzarella di Bufala, tomates San Marzano et basilic frais importés directement d'Italie",
                color: "from-red-500 to-pink-500",
              },
              {
                icon: Clock,
                title: "Livraison Express",
                description:
                  "Vos pizzas livrées chaudes en 15-20 minutes maximum grâce à notre réseau de livreurs",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Award,
                title: "Savoir-faire Artisanal",
                description:
                  "Pâte pétrie à la main et cuisson au feu de bois par nos maîtres pizzaïolos certifiés",
                color: "from-purple-500 to-pink-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-2"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section avec gradient moderne */}
      <section className="py-20 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Une envie soudaine de pizza ?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {config.cta_text}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-orange-600 hover:bg-gray-200"
            >
              <Link href="/menu">Commander maintenant</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-white bg-transparent text-white hover:bg-white/30"
            >
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
