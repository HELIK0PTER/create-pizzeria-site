'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Product = {
  id: string;
  name: string;
  categoryId: string;
};

export default function AddMenuPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pizzas, setPizzas] = useState<Product[]>([])
  const [drinks, setDrinks] = useState<Product[]>([])
  const [desserts, setDesserts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    pizzaIds: [] as string[],
    drinkIds: [] as string[],
    dessertIds: [] as string[],
    price: '' // Ajout du prix pour le menu
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      
      // Fetch categories first to get their IDs
      const categoriesResponse = await fetch('/api/categories')
      if (!categoriesResponse.ok) {
        throw new Error('Erreur lors du chargement des catégories')
      }
      const categoriesData = await categoriesResponse.json()

      const pizzaCategoryId = categoriesData.find((cat: { name: string; }) => cat.name === 'Pizza')?.id
      const drinkCategoryId = categoriesData.find((cat: { name: string; }) => cat.name === 'Boisson')?.id
      const dessertCategoryId = categoriesData.find((cat: { name: string; }) => cat.name === 'Dessert')?.id

      // Fetch all products
      const productsResponse = await fetch('/api/products')
      if (!productsResponse.ok) {
        throw new Error('Erreur lors du chargement des produits')
      }
      const productsData = await productsResponse.json()

      // Filter products by category ID
      setPizzas(productsData.filter((p: Product) => p.categoryId === pizzaCategoryId))
      setDrinks(productsData.filter((p: Product) => p.categoryId === drinkCategoryId))
      setDesserts(productsData.filter((p: Product) => p.categoryId === dessertCategoryId))

    } catch (err) {
      setError('Erreur lors du chargement des produits ou des catégories')
      console.error(err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Le nom du menu est requis')
      setIsLoading(false)
      return
    }

    if (!formData.image) {
      setError('Une image pour le menu est requise')
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
      console.log('Données envoyées:', formData)

      const response = await fetch('/api/menus', { // Nouvelle API pour les menus
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
        throw new Error(errorData.error || 'Erreur lors de la création du menu')
      }

      const newMenu = await response.json()
      console.log('Menu créé:', newMenu)

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/menus') // Redirection vers la page de gestion des menus
      }, 2000)

    } catch (err) {
      setError('Erreur lors de la création du menu : ' + String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" asChild>
          <Link href="/admin/menus">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ajouter un menu</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
          <AlertDescription>
            Menu créé avec succès ! Redirection en cours...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations générales du menu */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales du menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du menu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Menu Famille"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Image du menu *</Label>
                <ImageUpload
                  currentImage={formData.image}
                  onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                />
              </div>

              <div>
                <Label htmlFor="price">Prix (€) du menu *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                  placeholder="29.90"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Sélection des produits pour le menu */}
          <Card>
            <CardHeader>
              <CardTitle>Composition du menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pizzas">Pizzas</Label>
                <Select
                  value={formData.pizzaIds[0] || ''} // Permettre la sélection multiple si nécessaire
                  onValueChange={(value) => setFormData(prev => ({...prev, pizzaIds: [value]}))}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "Chargement..." : "Sélectionner une pizza"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pizzas.map((pizza) => (
                      <SelectItem key={pizza.id} value={pizza.id}>
                        {pizza.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="drinks">Boissons</Label>
                <Select
                  value={formData.drinkIds[0] || ''}
                  onValueChange={(value) => setFormData(prev => ({...prev, drinkIds: [value]}))}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "Chargement..." : "Sélectionner une boisson"} />
                  </SelectTrigger>
                  <SelectContent>
                    {drinks.map((drink) => (
                      <SelectItem key={drink.id} value={drink.id}>
                        {drink.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="desserts">Desserts</Label>
                <Select
                  value={formData.dessertIds[0] || ''}
                  onValueChange={(value) => setFormData(prev => ({...prev, dessertIds: [value]}))}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "Chargement..." : "Sélectionner un dessert"} />
                  </SelectTrigger>
                  <SelectContent>
                    {desserts.map((dessert) => (
                      <SelectItem key={dessert.id} value={dessert.id}>
                        {dessert.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer le menu
            </>
          )}
        </Button>
      </form>
    </div>
  )
} 