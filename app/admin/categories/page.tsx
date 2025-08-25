'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MoreHorizontal, Edit, Trash2, Package, Search, Filter, ShoppingCart, Save } from 'lucide-react'
import { Category } from '@prisma/client'
import { cn } from '@/lib/utils'

type CategoryWithCount = Category & {
  _count: {
    products: number
  }
}

type Product = {
  id: string
  name: string
  price: number
  isAvailable: boolean
  image: string | null
  categoryId: number
  category: {
    id: number
    name: string
  }
}

type CategoryWithProducts = Category & {
  _count: {
    products: number
  }
  products: Product[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithProducts | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetchCategories()
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits')
      }
      const data = await response.json()
      setAllProducts(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories')
      }
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      setErrorMessage('')
      
      if (!formData.name.trim()) {
        setErrorMessage('Le nom de la catégorie est requis')
        return
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la catégorie')
      }

      await fetchCategories()
      setIsAddDialogOpen(false)
      setFormData({ name: '', description: '' })
      setErrorMessage('')
    } catch (error) {
      console.error('Erreur:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie')
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory) return

    try {
      setErrorMessage('')
      
      if (!formData.name.trim()) {
        setErrorMessage('Le nom de la catégorie est requis')
        return
      }

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification de la catégorie')
      }

      await fetchCategories()
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '' })
      setSelectedProducts([])
      setErrorMessage('')
    } catch (error) {
      console.error('Erreur:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors de la modification de la catégorie')
    }
  }

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleSaveProducts = async () => {
    if (!editingCategory) return

    try {
      setErrorMessage('')
      
      // Récupérer les produits actuellement dans la catégorie
      const currentProductIds = editingCategory.products.map(p => p.id)
      
      // Produits à ajouter (sélectionnés mais pas dans la catégorie actuelle)
      const productsToAdd = selectedProducts.filter(id => !currentProductIds.includes(id))
      
      if (productsToAdd.length === 0) {
        setErrorMessage('Aucun nouveau produit à ajouter')
        return
      }

      console.log('Produits à ajouter:', productsToAdd)
      console.log('ID de la catégorie:', editingCategory.id)

      // Ajouter les nouveaux produits à la catégorie
      const results = await Promise.allSettled(
        productsToAdd.map(productId =>
          fetch(`/api/products/${productId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              categoryId: editingCategory.id
            }),
          })
        )
      )

      // Vérifier les résultats
      const failedUpdates = results.filter(result => result.status === 'rejected')


      if (failedUpdates.length > 0) {
        setErrorMessage(`${failedUpdates.length} produit(s) n'ont pas pu être ajoutés`)
        return
      }

      // Recharger les données
      await fetchCategories()
      await fetchAllProducts()
      
      // Recharger la catégorie en cours d'édition
      const response = await fetch(`/api/categories/${editingCategory.id}`)
      if (response.ok) {
        const updatedCategory: CategoryWithProducts = await response.json()
        setEditingCategory(updatedCategory)
        setSelectedProducts(updatedCategory.products.map(p => p.id))
      }

      // Message de succès temporaire
      setErrorMessage('')
      setTimeout(() => {
        setErrorMessage('Produits ajoutés avec succès !')
        setTimeout(() => setErrorMessage(''), 2000)
      }, 100)

    } catch (error) {
      console.error('Erreur lors de la sauvegarde des produits:', error)
      setErrorMessage('Erreur lors de la sauvegarde des produits')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la catégorie')
      }

      await fetchCategories()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const openEditDialog = async (category: CategoryWithCount) => {
    try {
      // Récupérer les détails de la catégorie avec ses produits
      const response = await fetch(`/api/categories/${category.id.toString()}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la catégorie')
      }
      const categoryWithProducts: CategoryWithProducts = await response.json()
      
      setEditingCategory(categoryWithProducts)
      setFormData({
        name: categoryWithProducts.name,
        description: categoryWithProducts.description || ''
      })
      // Initialiser les produits sélectionnés avec ceux de la catégorie
      setSelectedProducts(categoryWithProducts.products.map(p => p.id))
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Chargement des catégories...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-500" />
            Gestion des Catégories
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Organisez vos produits en catégories pour une meilleure expérience client
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
              <DialogDescription>
                Créez une nouvelle catégorie pour organiser vos produits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="name">Nom de la catégorie</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pizzas, Boissons, Desserts"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false)
                setErrorMessage('')
                setFormData({ name: '', description: '' })
              }}>
                Annuler
              </Button>
              <Button onClick={handleAddCategory} disabled={!formData.name.trim()}>
                Créer la catégorie
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700">Total Catégories</p>
                <p className="text-2xl font-bold text-orange-900">{categories.length}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Avec Description</p>
                <p className="text-2xl font-bold text-blue-900">
                  {categories.filter(c => c.description).length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Récentes</p>
                <p className="text-2xl font-bold text-green-900">
                  {categories.filter(c => {
                    const createdAt = new Date(c.createdAt)
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                    return createdAt > oneWeekAgo
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                  +7j
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">Total Produits</p>
                <p className="text-2xl font-bold text-purple-900">
                  {categories.reduce((total, cat) => total + (cat._count?.products || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card className="mb-4 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une catégorie par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500 h-9"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1 bg-orange-100 text-orange-800 border-orange-200 text-xs">
              {filteredCategories.length} catégorie{filteredCategories.length > 1 ? 's' : ''} trouvée{filteredCategories.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie créée'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre première catégorie'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une catégorie
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'Aucune description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {category._count?.products || 0} produit{(category._count?.products || 0) > 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(category.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action ne peut pas être annulée. Cela supprimera définitivement la catégorie &ldquo;{category.name}&rdquo;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id.toString())}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

             {/* Dialog de modification */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Modifier la catégorie</DialogTitle>
             <DialogDescription>
               Modifiez les informations de la catégorie &ldquo;{editingCategory?.name}&rdquo;.
             </DialogDescription>
           </DialogHeader>
           
           <Tabs defaultValue="info" className="w-full">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="info">Informations</TabsTrigger>
               <TabsTrigger value="products">Produits ({editingCategory?.products.length || 0})</TabsTrigger>
             </TabsList>
             
             <TabsContent value="info" className="space-y-4">
               {errorMessage && (
                 <Alert variant="destructive">
                   <AlertDescription>{errorMessage}</AlertDescription>
                 </Alert>
               )}
               <div>
                 <Label htmlFor="edit-name">Nom de la catégorie</Label>
                 <Input
                   id="edit-name"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   placeholder="Ex: Pizzas, Boissons, Desserts"
                 />
               </div>
               <div>
                 <Label htmlFor="edit-description">Description (optionnel)</Label>
                 <Textarea
                   id="edit-description"
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   placeholder="Description de la catégorie..."
                   rows={3}
                 />
               </div>
             </TabsContent>
             
                           <TabsContent value="products" className="space-y-4">
                {errorMessage && (
                  <Alert variant={errorMessage.includes('succès') ? "default" : "destructive"}>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Produits dans cette catégorie</h4>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleSaveProducts}
                    disabled={selectedProducts.length === 0}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les changements
                  </Button>
                </div>
               
               {editingCategory?.products.length === 0 ? (
                 <div className="text-center py-12">
                   <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                     <ShoppingCart className="h-8 w-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
                   <p className="text-gray-600">Cette catégorie ne contient aucun produit pour le moment.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2">
                   {editingCategory?.products.map((product) => (
                     <div key={product.id} className="relative group">
                       <div className={cn(
                         "flex items-center space-x-3 p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer",
                         selectedProducts.includes(product.id) 
                           ? "border-orange-500 bg-orange-50 shadow-md" 
                           : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 hover:shadow-sm"
                       )}>
                         <input
                           type="checkbox"
                           checked={selectedProducts.includes(product.id)}
                           onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                           className="rounded border-2 border-gray-300 checked:border-orange-500 checked:bg-orange-500"
                         />
                         <div className="flex-1 min-w-0">
                           <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                           <div className="flex items-center gap-2 mt-1">
                             <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                               {product.price.toFixed(2)}€
                             </Badge>
                             <Badge variant={product.isAvailable ? "default" : "destructive"} className="text-xs">
                               {product.isAvailable ? 'Disponible' : 'Indisponible'}
                             </Badge>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               
               <div className="border-t pt-6">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="p-2 bg-blue-100 rounded-full">
                     <Plus className="h-4 w-4 text-blue-600" />
                   </div>
                   <h4 className="text-lg font-semibold text-gray-900">Ajouter des produits depuis d&apos;autres catégories</h4>
                 </div>
                 
                 {allProducts.filter(product => product.categoryId !== editingCategory?.id).length === 0 ? (
                   <div className="text-center py-8">
                     <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                       <Package className="h-6 w-6 text-gray-400" />
                     </div>
                     <p className="text-gray-600">Tous les produits sont déjà dans cette catégorie</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2">
                     {allProducts
                       .filter(product => product.categoryId !== editingCategory?.id)
                       .map((product) => (
                         <div key={product.id} className="relative group">
                           <div className={cn(
                             "flex items-center space-x-3 p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer",
                             selectedProducts.includes(product.id) 
                               ? "border-blue-500 bg-blue-50 shadow-md" 
                               : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm"
                           )}>
                             <input
                               type="checkbox"
                               checked={selectedProducts.includes(product.id)}
                               onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                               className="rounded border-2 border-gray-300 checked:border-blue-500 checked:bg-blue-500"
                             />
                             <div className="flex-1 min-w-0">
                               <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                               <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                   {product.price.toFixed(2)}€
                                 </Badge>
                                 <Badge variant={product.isAvailable ? "default" : "destructive"} className="text-xs">
                                   {product.isAvailable ? 'Disponible' : 'Indisponible'}
                                 </Badge>
                                 
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                   </div>
                 )}
               </div>
             </TabsContent>
           </Tabs>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => {
               setIsEditDialogOpen(false)
               setErrorMessage('')
               setEditingCategory(null)
               setFormData({ name: '', description: '' })
               setSelectedProducts([])
             }}>
               Annuler
             </Button>
             <Button onClick={handleEditCategory} disabled={!formData.name.trim()}>
               Sauvegarder
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  )
}
