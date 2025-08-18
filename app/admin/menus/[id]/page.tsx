'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Utensils, Pizza, Coffee, IceCream, Settings } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Menu, MenuProduct, Product, Category } from '@prisma/client'

type MenuWithProducts = Menu & {
  menuProducts: (MenuProduct & {
    product: Product & {
      category: Category;
    };
  })[];
};

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [menu, setMenu] = useState<MenuWithProducts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState<string>('')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setMenuId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (menuId) {
      fetchMenu()
    }
  }, [menuId])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/menus/${menuId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du menu')
      }

      const menuData = await response.json()
      setMenu(menuData)
    } catch (err) {
      setError('Erreur lors du chargement du menu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenu = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce menu ?')) {
      return
    }

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      // Rediriger vers la liste des menus
      window.location.href = '/admin/menus'
    } catch (err) {
      setError('Erreur lors de la suppression du menu')
      console.error(err)
    }
  }

  const getProductCounts = (menu: MenuWithProducts) => {
    const pizzas = menu.menuProducts.filter(mp => mp.type === 'pizza').length
    const drinks = menu.menuProducts.filter(mp => mp.type === 'drink').length
    const desserts = menu.menuProducts.filter(mp => mp.type === 'dessert').length
    return { pizzas, drinks, desserts }
  }

  const getMenuConfiguration = (menu: MenuWithProducts) => {
    const config = {
      pizzas: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category } })[] },
      drinks: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category } })[] },
      desserts: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category } })[] }
    }

    menu.menuProducts.forEach(mp => {
      if (mp.type === 'pizza') {
        config.pizzas.allowChoice = mp.allowChoice
        config.pizzas.minQuantity = mp.minQuantity
        config.pizzas.maxQuantity = mp.maxQuantity
        config.pizzas.products.push(mp)
      } else if (mp.type === 'drink') {
        config.drinks.allowChoice = mp.allowChoice
        config.drinks.minQuantity = mp.minQuantity
        config.drinks.maxQuantity = mp.maxQuantity
        config.drinks.products.push(mp)
      } else if (mp.type === 'dessert') {
        config.desserts.allowChoice = mp.allowChoice
        config.desserts.minQuantity = mp.minQuantity
        config.desserts.maxQuantity = mp.maxQuantity
        config.desserts.products.push(mp)
      }
    })

    return config
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Chargement du menu...</span>
        </div>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu non trouvé</h1>
          <p className="text-gray-600 mb-6">{error || 'Le menu demandé n\'existe pas'}</p>
          <Button asChild>
            <Link href="/admin/menus">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux menus
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const counts = getProductCounts(menu)
  const config = getMenuConfiguration(menu)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link href="/admin/menus">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-orange-500" />
            {menu.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Détails et configuration du menu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/menus/${menu.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeleteMenu}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Prix</label>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(menu.price)}</p>
              </div>
              
              {menu.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{menu.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Date de création</label>
                <p className="text-gray-900">{new Date(menu.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>

              {menu.image && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Image</label>
                  <img 
                    src={menu.image} 
                    alt={menu.name} 
                    className="w-full h-48 object-cover rounded-lg mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Composition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pizza className="h-5 w-5 text-red-500" />
                  <span>Pizzas</span>
                </div>
                <Badge variant="secondary">{counts.pizzas}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-blue-500" />
                  <span>Boissons</span>
                </div>
                <Badge variant="secondary">{counts.drinks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IceCream className="h-5 w-5 text-purple-500" />
                  <span>Desserts</span>
                </div>
                <Badge variant="secondary">{counts.desserts}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration détaillée */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration détaillée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pizzas */}
              {counts.pizzas > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Pizza className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold">Pizzas</h3>
                    <Badge variant={config.pizzas.allowChoice ? "default" : "secondary"}>
                      {config.pizzas.allowChoice ? 
                        `Choix ${config.pizzas.minQuantity}-${config.pizzas.maxQuantity}` : 
                        'Produits fixes'
                      }
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.pizzas.products.map((mp) => (
                      <div key={mp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mp.product.image && (
                            <img src={mp.product.image} alt={mp.product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{mp.product.name}</p>
                            <p className="text-sm text-gray-500">{formatPrice(mp.product.price)}</p>
                          </div>
                        </div>
                        {config.pizzas.allowChoice && (
                          <Badge variant="outline" className="text-xs">
                            {mp.minQuantity}-{mp.maxQuantity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boissons */}
              {counts.drinks > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Coffee className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Boissons</h3>
                    <Badge variant={config.drinks.allowChoice ? "default" : "secondary"}>
                      {config.drinks.allowChoice ? 
                        `Choix ${config.drinks.minQuantity}-${config.drinks.maxQuantity}` : 
                        'Produits fixes'
                      }
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.drinks.products.map((mp) => (
                      <div key={mp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mp.product.image && (
                            <img src={mp.product.image} alt={mp.product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{mp.product.name}</p>
                            <p className="text-sm text-gray-500">{formatPrice(mp.product.price)}</p>
                          </div>
                        </div>
                        {config.drinks.allowChoice && (
                          <Badge variant="outline" className="text-xs">
                            {mp.minQuantity}-{mp.maxQuantity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desserts */}
              {counts.desserts > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <IceCream className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold">Desserts</h3>
                    <Badge variant={config.desserts.allowChoice ? "default" : "secondary"}>
                      {config.desserts.allowChoice ? 
                        `Choix ${config.desserts.minQuantity}-${config.desserts.maxQuantity}` : 
                        'Produits fixes'
                      }
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.desserts.products.map((mp) => (
                      <div key={mp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mp.product.image && (
                            <img src={mp.product.image} alt={mp.product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{mp.product.name}</p>
                            <p className="text-sm text-gray-500">{formatPrice(mp.product.price)}</p>
                          </div>
                        </div>
                        {config.desserts.allowChoice && (
                          <Badge variant="outline" className="text-xs">
                            {mp.minQuantity}-{mp.maxQuantity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
