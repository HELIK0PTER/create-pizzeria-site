'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    categoryId: '',
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

    if (!formData.categoryId) {
      setError('Veuillez sélectionner une catégorie')
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
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({...prev, categoryId: value}))}
                  required
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? "Chargement..." : "Sélectionner une catégorie"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Sauce tomate, mozzarella, basilic frais, huile d'olive"
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
          <Button type="submit" disabled={isLoading || loadingCategories}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
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
              <p><strong>Category ID sélectionné:</strong> {formData.categoryId || 'Aucun'}</p>
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