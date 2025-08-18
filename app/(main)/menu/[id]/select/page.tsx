'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Pizza, Coffee, IceCream, Plus, Settings, CheckCircle, XCircle, Minus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { Menu, MenuProduct, Product, Category, Variant } from '@prisma/client'

type MenuWithProducts = Menu & {
  description?: string;
  menuProducts: (MenuProduct & {
    allowChoice: boolean;
    minQuantity: number;
    maxQuantity: number;
    product: Product & {
      category: Category;
      variants: Variant[];
    };
  })[];
};

type ProductSelection = {
  productId: string;
  variantId: string;
  quantity: number;
};

export default function MenuSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { addMenuItem } = useCart()
  const [menu, setMenu] = useState<MenuWithProducts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState<string>('')
  const [selections, setSelections] = useState<{
    pizzas: ProductSelection[];
    drinks: ProductSelection[];
    desserts: ProductSelection[];
  }>({
    pizzas: [],
    drinks: [],
    desserts: []
  })

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

  const getMenuConfiguration = (menu: MenuWithProducts) => {
    const config = {
      pizzas: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category; variants: Variant[] } })[] },
      drinks: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category; variants: Variant[] } })[] },
      desserts: { allowChoice: false, minQuantity: 0, maxQuantity: 0, products: [] as (MenuProduct & { product: Product & { category: Category; variants: Variant[] } })[] }
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

  const toggleProductSelection = (type: 'pizzas' | 'drinks' | 'desserts', productId: string, variantId: string) => {
    setSelections(prev => {
      const currentSelections = prev[type]
      const existingIndex = currentSelections.findIndex(s => s.productId === productId)

      if (existingIndex >= 0) {
        // Retirer le produit
        const newSelections = currentSelections.filter(s => s.productId !== productId)
        return { ...prev, [type]: newSelections }
      } else {
        // Ajouter le produit
        const newSelection: ProductSelection = {
          productId,
          variantId,
          quantity: 1
        }
        return { ...prev, [type]: [...currentSelections, newSelection] }
      }
    })
  }

  const updateProductQuantity = (type: 'pizzas' | 'drinks' | 'desserts', productId: string, newQuantity: number) => {
    setSelections(prev => {
      const currentSelections = prev[type]
      const existingIndex = currentSelections.findIndex(s => s.productId === productId)

      if (existingIndex >= 0) {
        const updatedSelections = [...currentSelections]
        updatedSelections[existingIndex] = {
          ...updatedSelections[existingIndex],
          quantity: Math.max(1, newQuantity)
        }
        return { ...prev, [type]: updatedSelections }
      }
      return prev
    })
  }



  const isProductSelected = (type: 'pizzas' | 'drinks' | 'desserts', productId: string) => {
    return selections[type].some(s => s.productId === productId)
  }

  const getSelectionCount = (type: 'pizzas' | 'drinks' | 'desserts') => {
    return selections[type].reduce((total, selection) => total + selection.quantity, 0)
  }

  const getProductQuantity = (type: 'pizzas' | 'drinks' | 'desserts', productId: string) => {
    const selection = selections[type].find(s => s.productId === productId)
    return selection ? selection.quantity : 0
  }



  const isSelectionValid = () => {
    if (!menu) return false
    
    const config = getMenuConfiguration(menu)
    
    // Vérifier les pizzas
    if (config.pizzas.allowChoice) {
      const pizzaCount = getSelectionCount('pizzas')
      if (pizzaCount < config.pizzas.minQuantity) {
        return false
      }
    } else if (config.pizzas.products.length > 0) {
      // Mode fixe : tous les produits doivent être sélectionnés
      if (getSelectionCount('pizzas') !== config.pizzas.products.length) {
        return false
      }
    }

    // Vérifier les boissons
    if (config.drinks.allowChoice) {
      const drinkCount = getSelectionCount('drinks')
      if (drinkCount < config.drinks.minQuantity) {
        return false
      }
    } else if (config.drinks.products.length > 0) {
      if (getSelectionCount('drinks') !== config.drinks.products.length) {
        return false
      }
    }

    // Vérifier les desserts
    if (config.desserts.allowChoice) {
      const dessertCount = getSelectionCount('desserts')
      if (dessertCount < config.desserts.minQuantity) {
        return false
      }
    } else if (config.desserts.products.length > 0) {
      if (getSelectionCount('desserts') !== config.desserts.products.length) {
        return false
      }
    }

    return true
  }



  const handleAddToCart = () => {
    if (!menu || !isSelectionValid()) return

    // Préparer les sélections pour le menu
    const menuSelections = {
      pizzas: selections.pizzas.map(selection => {
        const menuProduct = menu.menuProducts.find(mp => mp.productId === selection.productId)
        return {
          productId: selection.productId,
          productName: menuProduct?.product.name || '',
          quantity: selection.quantity
        }
      }),
      drinks: selections.drinks.map(selection => {
        const menuProduct = menu.menuProducts.find(mp => mp.productId === selection.productId)
        return {
          productId: selection.productId,
          productName: menuProduct?.product.name || '',
          quantity: selection.quantity
        }
      }),
      desserts: selections.desserts.map(selection => {
        const menuProduct = menu.menuProducts.find(mp => mp.productId === selection.productId)
        return {
          productId: selection.productId,
          productName: menuProduct?.product.name || '',
          quantity: selection.quantity
        }
      })
    }

    // Créer l'objet menu pour le panier
    const menuItem = {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      image: menu.image || undefined,
      quantity: 1,
      selections: menuSelections
    }

    // Ajouter le menu au panier
    addMenuItem(menuItem)

    // Rediriger vers le panier
    router.push('/cart')
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
            <Link href="/menu">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au menu
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const config = getMenuConfiguration(menu)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link href="/menu">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
                 <div className="flex-1">
           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
             <Settings className="h-6 w-6 text-orange-500" />
             {menu.name}
           </h1>
           <p className="text-gray-600 mt-2">
             Personnalisez votre menu selon vos préférences
           </p>
                       <div className="flex items-center gap-4 mt-3">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-lg px-4 py-2">
                {formatPrice(menu.price)}
              </Badge>
              {menu.description && (
                <p className="text-sm text-gray-500 italic">{menu.description}</p>
              )}
            </div>
         </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration et résumé */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pizzas */}
              {config.pizzas.products.length > 0 && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Pizza className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Pizzas</span>
                                         <Badge variant="outline" className="ml-auto">
                       {getSelectionCount('pizzas')}/{config.pizzas.allowChoice ? config.pizzas.maxQuantity : config.pizzas.products.length}
                     </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {config.pizzas.allowChoice 
                      ? `Choisissez entre ${config.pizzas.minQuantity} et ${config.pizzas.maxQuantity} pizza(s)`
                      : 'Produits fixes inclus'
                    }
                  </p>
                </div>
              )}

              {/* Boissons */}
              {config.drinks.products.length > 0 && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Boissons</span>
                                         <Badge variant="outline" className="ml-auto">
                       {getSelectionCount('drinks')}/{config.drinks.allowChoice ? config.drinks.maxQuantity : config.drinks.products.length}
                     </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {config.drinks.allowChoice 
                      ? `Choisissez entre ${config.drinks.minQuantity} et ${config.drinks.maxQuantity} boisson(s)`
                      : 'Produits fixes inclus'
                    }
                  </p>
                </div>
              )}

              {/* Desserts */}
              {config.desserts.products.length > 0 && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IceCream className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Desserts</span>
                                         <Badge variant="outline" className="ml-auto">
                       {getSelectionCount('desserts')}/{config.desserts.allowChoice ? config.desserts.maxQuantity : config.desserts.products.length}
                     </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {config.desserts.allowChoice 
                      ? `Choisissez entre ${config.desserts.minQuantity} et ${config.desserts.maxQuantity} dessert(s)`
                      : 'Produits fixes inclus'
                    }
                  </p>
                </div>
              )}

              

               {/* Validation */}
               <div className="mt-6 p-4 border rounded-lg">
                 <div className="flex items-center gap-2 mb-2">
                   {isSelectionValid() ? (
                     <CheckCircle className="h-5 w-5 text-green-500" />
                   ) : (
                     <XCircle className="h-5 w-5 text-red-500" />
                   )}
                   <span className="font-medium">
                     {isSelectionValid() ? 'Sélection valide' : 'Sélection incomplète'}
                   </span>
                 </div>
                 <p className="text-sm text-gray-600">
                   {isSelectionValid() 
                     ? 'Votre sélection respecte la configuration du menu'
                     : 'Veuillez respecter les quantités minimales et maximales'
                   }
                 </p>
               </div>

                             {/* Bouton d'action */}
               <Button
                 onClick={handleAddToCart}
                 disabled={!isSelectionValid()}
                 className="w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold"
                 size="lg"
               >
                 <Plus className="h-5 w-5 mr-2" />
                 {isSelectionValid() ? 'Ajouter au panier' : 'Sélectionnez vos produits'}
               </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sélection des produits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pizzas */}
          {config.pizzas.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pizza className="h-5 w-5 text-red-500" />
                  Pizzas
                                     <Badge variant="outline">
                     {getSelectionCount('pizzas')}/{config.pizzas.allowChoice ? config.pizzas.maxQuantity : config.pizzas.products.length}
                   </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {config.pizzas.products.map((mp) => {
                      const isSelected = isProductSelected('pizzas', mp.productId)
                      const quantity = getProductQuantity('pizzas', mp.productId)
                     
                     return (
                       <div 
                         key={mp.id} 
                         className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                           isSelected 
                             ? 'border-orange-500 bg-orange-50' 
                             : 'border-gray-200 hover:border-orange-300'
                         }`}
                       >
                         {/* En-tête du produit */}
                         <div className="flex items-start gap-3 mb-3">
                           <Checkbox
                             id={`pizza-${mp.productId}`}
                             checked={isSelected}
                             onCheckedChange={() => toggleProductSelection('pizzas', mp.productId, mp.product.variants[0]?.id || '')}
                             disabled={config.pizzas.allowChoice && getSelectionCount('pizzas') >= config.pizzas.maxQuantity && !isSelected}
                             className="mt-1"
                           />
                           <div className="flex-1">
                             <Label htmlFor={`pizza-${mp.productId}`} className="font-semibold text-lg cursor-pointer">
                               {mp.product.name}
                             </Label>
                             <p className="text-sm text-gray-600 mt-1">{formatPrice(mp.product.price)}</p>
                             {mp.product.variants.length > 0 && (
                               <p className="text-xs text-gray-500 mt-1">
                                 {mp.product.variants[0].name}
                               </p>
                             )}
                           </div>
                           {mp.product.image && (
                             <img src={mp.product.image} alt={mp.product.name} className="w-16 h-16 object-cover rounded-lg" />
                           )}
                         </div>

                         {/* Contrôles de quantité */}
                         {isSelected && (
                           <div className="flex items-center justify-between mb-3 p-2 bg-white rounded border">
                             <span className="text-sm font-medium">Quantité:</span>
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('pizzas', mp.productId, quantity - 1)
                                 }}
                                 disabled={quantity <= 1}
                                 className="h-8 w-8 p-0"
                               >
                                 <Minus className="h-4 w-4" />
                               </Button>
                               <span className="w-8 text-center font-semibold">{quantity}</span>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('pizzas', mp.productId, quantity + 1)
                                 }}
                                 className="h-8 w-8 p-0"
                               >
                                 <Plus className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                         )}

                         
                       </div>
                     )
                   })}
                 </div>
              </CardContent>
            </Card>
          )}

          {/* Boissons */}
          {config.drinks.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-blue-500" />
                  Boissons
                                     <Badge variant="outline">
                     {getSelectionCount('drinks')}/{config.drinks.allowChoice ? config.drinks.maxQuantity : config.drinks.products.length}
                   </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {config.drinks.products.map((mp) => {
                      const isSelected = isProductSelected('drinks', mp.productId)
                      const quantity = getProductQuantity('drinks', mp.productId)
                     
                     return (
                       <div 
                         key={mp.id} 
                         className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                           isSelected 
                             ? 'border-blue-500 bg-blue-50' 
                             : 'border-gray-200 hover:border-blue-300'
                         }`}
                       >
                         {/* En-tête du produit */}
                         <div className="flex items-start gap-3 mb-3">
                           <Checkbox
                             id={`drink-${mp.productId}`}
                             checked={isSelected}
                             onCheckedChange={() => toggleProductSelection('drinks', mp.productId, mp.product.variants[0]?.id || '')}
                             disabled={config.drinks.allowChoice && getSelectionCount('drinks') >= config.drinks.maxQuantity && !isSelected}
                             className="mt-1"
                           />
                           <div className="flex-1">
                             <Label htmlFor={`drink-${mp.productId}`} className="font-semibold text-lg cursor-pointer">
                               {mp.product.name}
                             </Label>
                             <p className="text-sm text-gray-600 mt-1">{formatPrice(mp.product.price)}</p>
                             {mp.product.variants.length > 0 && (
                               <p className="text-xs text-gray-500 mt-1">
                                 {mp.product.variants[0].name}
                               </p>
                             )}
                           </div>
                           {mp.product.image && (
                             <img src={mp.product.image} alt={mp.product.name} className="w-16 h-16 object-cover rounded-lg" />
                           )}
                         </div>

                         {/* Contrôles de quantité */}
                         {isSelected && (
                           <div className="flex items-center justify-between mb-3 p-2 bg-white rounded border">
                             <span className="text-sm font-medium">Quantité:</span>
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('drinks', mp.productId, quantity - 1)
                                 }}
                                 disabled={quantity <= 1}
                                 className="h-8 w-8 p-0"
                               >
                                 <Minus className="h-4 w-4" />
                               </Button>
                               <span className="w-8 text-center font-semibold">{quantity}</span>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('drinks', mp.productId, quantity + 1)
                                 }}
                                 className="h-8 w-8 p-0"
                               >
                                 <Plus className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                         )}

                         
                       </div>
                     )
                   })}
                 </div>
              </CardContent>
            </Card>
          )}

          {/* Desserts */}
          {config.desserts.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IceCream className="h-5 w-5 text-purple-500" />
                  Desserts
                                     <Badge variant="outline">
                     {getSelectionCount('desserts')}/{config.desserts.allowChoice ? config.desserts.maxQuantity : config.desserts.products.length}
                   </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {config.desserts.products.map((mp) => {
                      const isSelected = isProductSelected('desserts', mp.productId)
                      const quantity = getProductQuantity('desserts', mp.productId)
                     
                     return (
                       <div 
                         key={mp.id} 
                         className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                           isSelected 
                             ? 'border-purple-500 bg-purple-50' 
                             : 'border-gray-200 hover:border-purple-300'
                         }`}
                       >
                         {/* En-tête du produit */}
                         <div className="flex items-start gap-3 mb-3">
                           <Checkbox
                             id={`dessert-${mp.productId}`}
                             checked={isSelected}
                             onCheckedChange={() => toggleProductSelection('desserts', mp.productId, mp.product.variants[0]?.id || '')}
                             disabled={config.desserts.allowChoice && getSelectionCount('desserts') >= config.desserts.maxQuantity && !isSelected}
                             className="mt-1"
                           />
                           <div className="flex-1">
                             <Label htmlFor={`dessert-${mp.productId}`} className="font-semibold text-lg cursor-pointer">
                               {mp.product.name}
                             </Label>
                             <p className="text-sm text-gray-600 mt-1">{formatPrice(mp.product.price)}</p>
                             {mp.product.variants.length > 0 && (
                               <p className="text-xs text-gray-500 mt-1">
                                 {mp.product.variants[0].name}
                               </p>
                             )}
                           </div>
                           {mp.product.image && (
                             <img src={mp.product.image} alt={mp.product.name} className="w-16 h-16 object-cover rounded-lg" />
                           )}
                         </div>

                         {/* Contrôles de quantité */}
                         {isSelected && (
                           <div className="flex items-center justify-between mb-3 p-2 bg-white rounded border">
                             <span className="text-sm font-medium">Quantité:</span>
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('desserts', mp.productId, quantity - 1)
                                 }}
                                 disabled={quantity <= 1}
                                 className="h-8 w-8 p-0"
                               >
                                 <Minus className="h-4 w-4" />
                               </Button>
                               <span className="w-8 text-center font-semibold">{quantity}</span>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   updateProductQuantity('desserts', mp.productId, quantity + 1)
                                 }}
                                 className="h-8 w-8 p-0"
                               >
                                 <Plus className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                         )}

                         
                       </div>
                     )
                   })}
                 </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
