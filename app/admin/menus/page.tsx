'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Plus, Utensils, Pizza, Coffee, IceCream, Edit, Trash2, Eye } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { Menu, MenuProduct, Product, Category } from '@prisma/client'

type MenuWithProducts = Menu & {
  menuProducts: (MenuProduct & {
    product: Product & {
      category: Category;
    };
  })[];
};

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<MenuWithProducts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menus')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des menus')
      }

      const menusData = await response.json()
      setMenus(menusData)
    } catch (err) {
      setError('Erreur lors du chargement des menus')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
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

      // Recharger les menus
      fetchMenus()
    } catch (err) {
      setError('Erreur lors de la suppression du menu')
      console.error(err)
    }
  }

  const filteredMenus = menus.filter(menu =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.menuProducts.some(mp => 
      mp.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getProductCounts = (menu: MenuWithProducts) => {
    const pizzas = menu.menuProducts.filter(mp => mp.type === 'pizza').length
    const drinks = menu.menuProducts.filter(mp => mp.type === 'drink').length
    const desserts = menu.menuProducts.filter(mp => mp.type === 'dessert').length
    return { pizzas, drinks, desserts }
  }

  const getMenuConfiguration = (menu: MenuWithProducts) => {
    const config = {
      pizzas: { allowChoice: false, minQuantity: 0, maxQuantity: 0, count: 0 },
      drinks: { allowChoice: false, minQuantity: 0, maxQuantity: 0, count: 0 },
      desserts: { allowChoice: false, minQuantity: 0, maxQuantity: 0, count: 0 }
    }

    menu.menuProducts.forEach(mp => {
      if (mp.type === 'pizza') {
        config.pizzas.allowChoice = mp.allowChoice
        config.pizzas.minQuantity = mp.minQuantity
        config.pizzas.maxQuantity = mp.maxQuantity
        config.pizzas.count++
      } else if (mp.type === 'drink') {
        config.drinks.allowChoice = mp.allowChoice
        config.drinks.minQuantity = mp.minQuantity
        config.drinks.maxQuantity = mp.maxQuantity
        config.drinks.count++
      } else if (mp.type === 'dessert') {
        config.desserts.allowChoice = mp.allowChoice
        config.desserts.minQuantity = mp.minQuantity
        config.desserts.maxQuantity = mp.maxQuantity
        config.desserts.count++
      }
    })

    return config
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Chargement des menus...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-8 w-8 text-orange-500" />
            Gestion des Menus
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos menus composés de pizzas, boissons et desserts
          </p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href="/admin/menus/add">
            <Plus className="h-4 w-4 mr-2" />
            Créer un Menu
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Menus</p>
                <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Pizza className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pizzas dans les menus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menus.reduce((total, menu) => 
                    total + menu.menuProducts.filter(mp => mp.type === 'pizza').length, 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Boissons dans les menus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menus.reduce((total, menu) => 
                    total + menu.menuProducts.filter(mp => mp.type === 'drink').length, 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Recherche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rechercher un menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Nom du menu ou nom d'un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des menus */}
      <Card>
        <CardHeader>
          <CardTitle>Menus disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMenus.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'Aucun menu trouvé' : 'Aucun menu créé pour le moment'}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/admin/menus/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre premier menu
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenus.map((menu) => {
                const counts = getProductCounts(menu)
                const config = getMenuConfiguration(menu)
                return (
                  <Card key={menu.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{menu.name}</CardTitle>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {formatPrice(menu.price)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {menu.menuProducts.length} produits
                            </Badge>
                          </div>
                          {menu.description && (
                            <p className="text-sm text-gray-600 mb-3">{menu.description}</p>
                          )}
                        </div>
                        {menu.image && (
                          <Image
                            src={menu.image}
                            alt={menu.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Configuration du menu */}
                      <div className="space-y-3 mb-4">
                        {counts.pizzas > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Pizza className="h-4 w-4 text-red-500" />
                              <span>{counts.pizzas} pizza{counts.pizzas > 1 ? 's' : ''}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {config.pizzas.allowChoice ? 
                                `Choix ${config.pizzas.minQuantity}-${config.pizzas.maxQuantity}` : 
                                'Fixe'
                              }
                            </Badge>
                          </div>
                        )}
                        {counts.drinks > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Coffee className="h-4 w-4 text-blue-500" />
                              <span>{counts.drinks} boisson{counts.drinks > 1 ? 's' : ''}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {config.drinks.allowChoice ? 
                                `Choix ${config.drinks.minQuantity}-${config.drinks.maxQuantity}` : 
                                'Fixe'
                              }
                            </Badge>
                          </div>
                        )}
                        {counts.desserts > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <IceCream className="h-4 w-4 text-purple-500" />
                              <span>{counts.desserts} dessert{counts.desserts > 1 ? 's' : ''}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {config.desserts.allowChoice ? 
                                `Choix ${config.desserts.minQuantity}-${config.desserts.maxQuantity}` : 
                                'Fixe'
                              }
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/admin/menus/${menu.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/menus/${menu.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMenu(menu.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
