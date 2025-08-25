'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ImageUpload } from '@/components/ui/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    categoryIds: [] as string[],
    price: '',
    ingredients: '',
    allergens: '',
    isAvailable: true
  })

  // Charger les catégories au montage du composant
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories')
      }
      const categoriesData = await response.json()
      setCategories(categoriesData)
    } catch (err) {
      setError('Erreur lors du chargement des catégories')
      console.error(err)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Générer automatiquement le slug à partir du nom
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation côté client
    if (!formData.name.trim()) {
      setError('Le nom du produit est requis')
      setIsLoading(false)
      return
    }

    if (formData.categoryIds.length === 0) {
      setError('Veuillez sélectionner au moins une catégorie')
      setIsLoading(false)
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Le prix doit être un nombre positif')
      setIsLoading(false)
      return
    }

    try {
      console.log('Données envoyées:', formData) // Debug

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: price
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      const newProduct = await response.json()
      console.log('Produit créé:', newProduct) // Debug

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)

    } catch (err) {
      setError('Erreur lors de la création du produit : ' + String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ajouter un produit</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
          <AlertDescription>
            Produit créé avec succès ! Redirection en cours...
          </AlertDescription>
        </Alert>
      )}

      {/* Note sur les catégories */}
      <Alert className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
        <AlertDescription>
          <strong>💡 Organisation des produits :</strong> Vous pouvez sélectionner plusieurs catégories pour un produit. La première catégorie sélectionnée sera utilisée comme catégorie principale. 
          <Link href="/admin/categories" className="text-blue-600 hover:text-blue-800 underline ml-1">
            Gérer les catégories →
          </Link>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Pizza Margherita"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({...prev, slug: e.target.value}))}
                  placeholder="pizza-margherita"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="La classique avec tomate, mozzarella et basilic frais"
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="categories">Catégories *</Label>
                {categories.length === 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
                      <p className="text-sm text-orange-800">
                        Aucune catégorie disponible. Vous devez créer au moins une catégorie avant d&apos;ajouter un produit.
                      </p>
                    </div>
                    <Button type="button" variant="outline" asChild className="w-full">
                      <Link href="/admin/categories">
                        Créer une catégorie
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, category.id]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: prev.categoryIds.filter(id => id !== category.id)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez une ou plusieurs catégories pour organiser votre produit.
                </p>
                {formData.categoryIds.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {formData.categoryIds.length} catégorie(s) sélectionnée(s)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                  placeholder="12.90"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Image et détails */}
          <Card>
            <CardHeader>
              <CardTitle>Image et détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                onUpload={(url) => setFormData(prev => ({...prev, image: url}))}
                currentImage={formData.image}
              />

              <div>
                <Label htmlFor="ingredients">Ingrédients</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData(prev => ({...prev, ingredients: e.target.value}))}
                  placeholder="Sauce tomate, mozzarella, basilic frais, huile d&apos;olive"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergens">Allergènes</Label>
                <Input
                  id="allergens"
                  value={formData.allergens}
                  onChange={(e) => setFormData(prev => ({...prev, allergens: e.target.value}))}
                  placeholder="Gluten, Lait"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || loadingCategories || formData.categoryIds.length === 0 || categories.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : categories.length === 0 ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créez d&apos;abord une catégorie
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer le produit
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">🔧 Debug Info</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Catégories chargées:</strong> {categories.length}</p>
              <p><strong>Image URL:</strong> {formData.image || 'Aucune'}</p>
              <p><strong>Category ID sélectionné:</strong> {formData.categoryIds.length > 0 ? formData.categoryIds[0] : 'Aucun'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note explicative */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Gestion des images</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• <strong>Upload fichier:</strong> Images optimisées et converties en WebP</p>
            <p>• <strong>URL d&apos;image:</strong> Utilisez des liens directs (Unsplash, etc.)</p>
            <p>• Taille maximale : 10MB (avant optimisation)</p>
            <p>• Résolution optimale : 800x600px</p>
            <p>• Formats acceptés : JPG, PNG, WebP</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 