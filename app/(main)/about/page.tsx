import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">À Propos de Nous</h1>

        <div className="space-y-12">
          {/* Section Histoire */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Notre Histoire</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-700 space-y-4">
                  <p>
                    {`Bienvenue chez Bella Pizza, né d'une passion pour l'authentique pizza napolitaine. Notre aventure a commencé il y a 15 ans dans un petit fournil avec le rêve de partager les saveurs traditionnelles de l'Italie.`}
                  </p>
                  <p>
                    {`Nous utilisons des ingrédients frais et de qualité supérieure, sourcés localement autant que possible, et une pâte longuement pétrie et maturée pour garantir cette texture légère et aérée caractéristique.`}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
                  alt="Notre pizzeria"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </section>

          {/* Section Valeurs */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
             <div className="order-2">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3"
                  alt="Nos ingrédients frais"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Nos Valeurs</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-700 space-y-4">
                  <p>
                    {`Chez Bella Pizza, nous croyons en la qualité, la fraîcheur et la convivialité. Chaque pizza est préparée avec soin et passion, comme si nous la préparions pour notre propre famille.`}
                  </p>
                  <p>
                    {`Nous nous engageons à offrir une expérience culinaire exceptionnelle, de la sélection des ingrédients à la dernière bouchée, tout en respectant l'environnement et en soutenant les producteurs locaux.`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section Satisfaction Client */}
          <section className="text-center">
            <h2 className="text-2xl font-bold mb-6">La satisfaction client, notre priorité</h2>
            <div className="grid grid-cols-1 gap-8 max-w-md mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Nos Avis Google</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center mb-2">
                    {/* Static 5-star rating */}
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600 font-semibold">4.8/5</span> {/* Replace with your actual average rating */}
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