import { OptimizedImage } from "@/components/ui/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import { about_us } from "@/settings/config";

export default function AboutPage() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          À Propos de Nous
        </h1>

        <div className="space-y-12">
          {/* Section Histoire */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    Notre Histoire
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-700 space-y-4 text-justify">
                  {about_us.our_history.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
                  alt={`Notre pizzeria`}
                  width={1000}
                  height={1000}
                  className="object-fill"
                />
              </div>
            </div>
          </section>

          {/* Section Valeurs */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3"
                  alt={`Nos ingrédients frais`}
                  width={1000}
                  height={1000}
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    Nos Valeurs
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-700 space-y-4 text-justify">
                  {about_us.our_values.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section Satisfaction Client */}
          <section className="text-center">
            <h2 className="text-2xl font-bold mb-6">
              La satisfaction client, notre priorité
            </h2>
            <div className="grid grid-cols-1 gap-8 max-w-md mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">
                    Nos Avis Google
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center mb-2">
                    {/* Static 5-star rating */}
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600 font-semibold">
                      4.8/5
                    </span>{" "}
                    {/* Replace with your actual average rating */}
                  </div>
                  <p className="text-gray-700 mb-4">
                    Découvrez ce que nos clients disent de nous sur Google !
                  </p>
                  {/* Link to Google Reviews */}
                  <div className="flex justify-center">
                    <a
                      href="https://www.google.com/maps/place/147+Avenue+de+la+République,+75011+Paris"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 text-sm inline-flex items-center"
                    >
                      Voir tous les commentaires sur Google
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
