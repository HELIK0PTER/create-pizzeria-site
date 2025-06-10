"use client";

import { variables } from "@/settings/config";
import DropdownInfo from "@/components/layout/dropdownInfo";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Pizza, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product/product-card";
import { Prisma } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { GOOGLEMAPS_SECRET } from "@/utils/environement";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [isMounted, setIsMounted] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  if (!isMounted) return null;

  return (
    <div className="min-h-screen">
      {/* Message d'erreur d'accès refusé */}
      <Suspense>
        <ErrorMessage />
      </Suspense>

      {/* Hero Section: Background Image Layout */}
      <section className="relative overflow-hidden h-[calc(100vh-100px)] flex items-center bg-gray-50">
        {/* Background Image */}
        <Image
          priority
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Délicieuse pizza artisanale en fond"
          fill
          className="object-cover z-0"
          sizes="100vw"
          quality={100}
        />
        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>

        {/* Contenu de la Hero Section */}
        <div className="relative z-10 container mx-auto px-4 text-white text-center">
          {/* La section des offres a été retirée comme demandé */}

          <div className="space-y-6 mb-8 animate-fadeInUp animation-delay-200">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-lg">
              {variables.title_part1}{" "}
              <span className="text-orange-400">{variables.title_part2}</span>
            </h1>

            <p className="text-xl leading-relaxed text-pretty max-w-2xl mx-auto opacity-90 drop-shadow-md">
              {variables.cta_text}
            </p>
          </div>

          {/* Stats et Infos de livraison */}
          {/* Vous pouvez ajouter d'autres stats ou infos ici si nécessaire */}

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp animation-delay-600">
            <Button
              size="lg"
              asChild
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/menu">
                Commander maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <DropdownInfo />
      {/* Featured Products avec design amélioré */}
      <section
        id="menu"
        className="py-20 bg-gradient-to-br from-gray-50 to-orange-50 scroll-mt-20"
      >
        <div className="container mx-auto md:px-4 flex flex-col items-center">
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

          <div className="flex items-center space-x-2 mb-8">
            <Label htmlFor="toggle-view">Vue compacte</Label>
            <Switch
              id="toggle-view"
              checked={isCompactView}
              onCheckedChange={setIsCompactView}
            />
          </div>

          {/* TODO : Séparer les pizzas dans un composant coté client pour pouvoir gérer cette page coté serveur */}

          {loading ? (
            <div className={`grid ${isCompactView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 md:gap-8 lg:grid-cols-3"} mb-12 place-items-center gap-5 w-[90%] sm:w-full`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className={`grid ${isCompactView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 md:gap-8 lg:grid-cols-3"} mb-12 place-items-center gap-5 w-[90%] sm:w-full`}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} isCompact={isCompactView} />
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
            {isMounted && (
              <iframe
                width="100%"
                height="450"
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLEMAPS_SECRET}&q=147+Avenue+de+la+République,+75011+Paris`}
              ></iframe>
            )}
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
            {variables.cta_text}
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

const ErrorMessage = () => {
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
    }, 90000);

    return () => clearTimeout(timeout);
  }, [error, router, handleClearParams]);

  return (
    <>
      {errorMessage.message && (
        <Alert className="fixed top-0 right-0 w-fit z-[100] mx-4 mt-4 border-amber-200 bg-amber-50 flex items-center justify-between">
          <AlertDescription className="text-amber-800 font-black">
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
    </>
  );
};
