'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Package,
  Tag,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatPrice } from '@/lib/utils'
import { Prisma } from '@prisma/client'

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
  };
}>;

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Produit non trouvé')
        } else {
          setError('Erreur lors du chargement du produit')
        }
        return
      }

      const productData = await response.json()
      setProduct(productData)
    } catch (err) {
      setError('Erreur lors du chargement du produit')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product || !confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      router.push('/admin/products')
    } catch (err) {
      setError('Erreur lors de la suppression du produit')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Produit non trouvé'}</AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header avec navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">Détails du produit</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href={`/admin/products/${product.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteProduct}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image et informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Image du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'Aucune description disponible'}
              </p>
            </CardContent>
          </Card>

          {/* Ingrédients et Allergènes */}
          {(product.ingredients || product.allergens) && (
            <Card>
              <CardHeader>
                <CardTitle>Ingrédients et Allergènes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.ingredients && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ingrédients</h4>
                    <p className="text-gray-700">{product.ingredients}</p>
                  </div>
                )}
                {product.allergens && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Allergènes</h4>
                    <p className="text-gray-700">{product.allergens}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar avec informations */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Statut</span>
                <Badge 
                  variant={product.isAvailable ? "default" : "secondary"}
                  className={product.isAvailable ? "bg-green-100 text-green-800" : ""}
                >
                  {product.isAvailable ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Indisponible
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Catégorie</span>
                <Badge variant="secondary">
                  {product.category?.name || 'Sans catégorie'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Prix de base</span>
                <span className="font-semibold text-orange-600">
                  {formatPrice(product.price)}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Slug</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {product.slug}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">ID</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {product.id}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Variantes ({product.variants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{variant.name}</span>
                        {variant.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-orange-600">
                        {formatPrice(variant.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistiques fictives */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600">Note moyenne</span>
                </div>
                <span className="font-semibold">4.8/5</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Commandes</span>
                </div>
                <span className="font-semibold">127</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Temps moyen</span>
                </div>
                <span className="font-semibold">15-20 min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 