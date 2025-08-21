'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ImageUpload } from '@/components/ui/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ArrowLeft, Utensils, Pizza, Coffee, IceCream, Settings, Info } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

type Product = {
  id: string;
  name: string;
  categoryId: number;
  price: number;
  image?: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

type MenuProductConfig = {
  type: 'pizza' | 'drink' | 'dessert';
  allowChoice: boolean;
  minQuantity: number;
  maxQuantity: number;
  productIds: string[];
  fixedProducts: string[];
};

type ProductConfigField = 'productIds' | 'fixedProducts';

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
  const [formData, setFormData] = useState<{
    name: string;
    image: string;
    price: string;
    description: string;
    productConfigs: Array<{
      type: 'pizza' | 'drink' | 'dessert';
      allowChoice: boolean;
      minQuantity: number;
      maxQuantity: number;
      productIds: string[];
      fixedProducts: string[];
    }>;
  }>({
    name: '',
    image: '',
    price: '',
    description: '',
    productConfigs: [
      {
        type: 'pizza',
        allowChoice: true,
        minQuantity: 1,
        maxQuantity: 2,
        productIds: [],
        fixedProducts: []
      },
      {
        type: 'drink',
        allowChoice: true,
        minQuantity: 1,
        maxQuantity: 1,
        productIds: [],
        fixedProducts: []
      },
      {
        type: 'dessert',
        allowChoice: false,
        minQuantity: 1,
        maxQuantity: 1,
        productIds: [],
        fixedProducts: []
      }
    ]
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

      const pizzaCategoryId = categoriesData.find((cat: Category) => cat.slug === 'pizzas')?.id
      const drinkCategoryId = categoriesData.find((cat: Category) => cat.slug === 'boissons')?.id
      const dessertCategoryId = categoriesData.find((cat: Category) => cat.slug === 'desserts')?.id

      // Fetch all products
      const productsResponse = await fetch('/api/products')
      if (!productsResponse.ok) {
        throw new Error('Erreur lors du chargement des produits')
      }
      const productsData = await productsResponse.json()

      // Filter products by category ID
      const pizzasFiltered = productsData.filter((p: Product) => p.categoryId === pizzaCategoryId)
      const drinksFiltered = productsData.filter((p: Product) => p.categoryId === drinkCategoryId)
      const dessertsFiltered = productsData.filter((p: Product) => p.categoryId === dessertCategoryId)

      setPizzas(pizzasFiltered)
      setDrinks(drinksFiltered)
      setDesserts(dessertsFiltered)

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

    // L'image est optionnelle pour les menus

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Le prix doit être un nombre positif')
      setIsLoading(false)
      return
    }

    // Vérifier qu'au moins une configuration a des produits
    const hasProducts = formData.productConfigs.some(config => 
      config.allowChoice ? config.productIds.length > 0 : config.fixedProducts.length > 0
    )

    if (!hasProducts) {
      setError('Veuillez configurer au moins un type de produit pour le menu')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          image: formData.image,
          price: price,
          description: formData.description,
          productConfigs: formData.productConfigs
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du menu')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)

    } catch (err: unknown) {
      setError((err as Error)?.message || 'Erreur lors de la création du menu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
  }

  const updateProductConfig = (type: 'pizza' | 'drink' | 'dessert', field: keyof MenuProductConfig, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      productConfigs: prev.productConfigs.map(config => 
        config.type === type ? { ...config, [field]: value } : config
      )
    }))
  }

  const toggleProductSelection = (productId: string, type: 'pizza' | 'drink' | 'dessert', isFixed: boolean = false) => {
    const config = formData.productConfigs.find(c => c.type === type)
    if (!config) return
    const field = isFixed ? 'fixedProducts' : 'productIds'
    
    setFormData(prev => ({
      ...prev,
      productConfigs: prev.productConfigs.map(config => {
        if (config.type === type) {
          const currentIds = config[field] as string[]
          if (currentIds.includes(productId)) {
            return {
              ...config,
              [field]: currentIds.filter(id => id !== productId)
            }
          } else {
            return {
              ...config,
              [field]: [...currentIds, productId]
            }
          }
        }
        return config
      })
    }))
  }



  const isProductSelected = (type: 'pizza' | 'drink' | 'dessert', productId: string, field: ProductConfigField) => {
    const config = formData.productConfigs.find(c => c.type === type)
    if (!config) return false
    if (field === 'productIds') return config.productIds.includes(productId)
    if (field === 'fixedProducts') return config.fixedProducts.includes(productId)
    return false
  }

  const getProductsByType = (type: 'pizza' | 'drink' | 'dessert') => {
    switch (type) {
      case 'pizza': return pizzas
      case 'drink': return drinks
      case 'dessert': return desserts
      default: return []
    }
  }

  const getTypeIcon = (type: 'pizza' | 'drink' | 'dessert') => {
    switch (type) {
      case 'pizza': return <Pizza className="h-5 w-5 text-red-500" />
      case 'drink': return <Coffee className="h-5 w-5 text-blue-500" />
      case 'dessert': return <IceCream className="h-5 w-5 text-purple-500" />
    }
  }

  const getTypeName = (type: 'pizza' | 'drink' | 'dessert') => {
    switch (type) {
      case 'pizza': return 'Pizzas'
      case 'drink': return 'Boissons'
      case 'dessert': return 'Desserts'
    }
  }

  if (loadingProducts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Chargement des produits...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-orange-500" />
            Créer un Nouveau Menu
          </h1>
          <p className="text-gray-600 mt-2">
            Créez un menu configurable avec choix ou produits fixes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Menu créé avec succès ! Redirection en cours...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
          <Card>
            <CardHeader>
            <CardTitle>Informations du Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du menu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Menu Famille, Menu Découverte..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Prix du menu (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du menu..."
              />
            </div>

                        <div>
              <Label>Image du menu (optionnel)</Label>
              <ImageUpload
                onUpload={handleImageUpload}
                currentImage={formData.image}
              />
            </div>
            </CardContent>
          </Card>

        {/* Configuration des produits */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration des Produits
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configurez si l&apos;utilisateur a le choix ou si les produits sont fixes
            </p>
            </CardHeader>
          <CardContent className="space-y-6">
            {formData.productConfigs.map((config) => (
              <div key={config.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(config.type)}
                    <Label className="text-lg font-semibold">{getTypeName(config.type)}</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.allowChoice}
                        onCheckedChange={(checked) => updateProductConfig(config.type, 'allowChoice', checked)}
                      />
                      <Label className="text-sm">
                        {config.allowChoice ? 'Choix utilisateur' : 'Produits fixes'}
                      </Label>
                    </div>
                  </div>
              </div>

                {config.allowChoice ? (
                  // Configuration pour choix utilisateur
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantité minimale</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.minQuantity}
                          onChange={(e) => updateProductConfig(config.type, 'minQuantity', parseInt(e.target.value))}
                        />
                      </div>
              <div>
                        <Label>Quantité maximale</Label>
                        <Input
                          type="number"
                          min={config.minQuantity}
                          value={config.maxQuantity}
                          onChange={(e) => updateProductConfig(config.type, 'maxQuantity', parseInt(e.target.value))}
                        />
                      </div>
              </div>

              <div>
                      <Label className="flex items-center gap-2">
                        Produits disponibles pour le choix
                        <Badge variant="secondary">
                                                      {config.productIds.length} sélectionné(s)
                        </Badge>
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {getProductsByType(config.type).map((product) => (
                          <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={`${config.type}-choice-${product.id}`}
                              checked={isProductSelected(config.type, product.id, 'productIds')}
                              onCheckedChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  productConfigs: prev.productConfigs.map(c => {
                                    if (c.type === config.type) {
                                      const productIds = c.productIds.includes(product.id)
                                        ? c.productIds.filter((id: string) => id !== product.id)
                                        : [...c.productIds, product.id]
                                      return { ...c, productIds }
                                    }
                                    return c
                                  })
                                }))
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={`${config.type}-choice-${product.id}`} className="text-sm font-medium cursor-pointer">
                                {product.name}
                              </Label>
                              <p className="text-xs text-gray-500">{product.price.toFixed(2)} €</p>
                            </div>
                            {product.image && (
                              <Image src={product.image} alt={product.name} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Configuration pour produits fixes
                  <div>
                    <Label className="flex items-center gap-2">
                      Produits fixes inclus dans le menu
                      <Badge variant="secondary">
                                                    {config.fixedProducts.length} sélectionné(s)
                      </Badge>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {getProductsByType(config.type).map((product) => (
                        <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={`${config.type}-fixed-${product.id}`}
                                                          checked={isProductSelected(config.type, product.id, 'fixedProducts')}
                            onCheckedChange={() => toggleProductSelection(product.id, config.type, true)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`${config.type}-fixed-${product.id}`} className="text-sm font-medium cursor-pointer">
                              {product.name}
                            </Label>
                            <p className="text-xs text-gray-500">{product.price.toFixed(2)} €</p>
                          </div>
                          {product.image && (
                            <Image src={product.image} alt={product.name} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      {config.allowChoice ? (
                        <>
                          <strong>Mode choix :</strong> L&apos;utilisateur pourra choisir entre {config.minQuantity} et {config.maxQuantity} produit(s) 
                                                      parmi {config.productIds.length} option(s) disponibles.
                        </>
                      ) : (
                        <>
                          <strong>Mode fixe :</strong> {config.fixedProducts.length} produit(s) sera(ont) automatiquement 
                          inclus dans le menu sans choix possible.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </CardContent>
          </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
          {isLoading ? (
            <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
                Créer le Menu
            </>
          )}
        </Button>
        </div>
      </form>
    </div>
  )
} 