'use client';
import React from 'react';

import Link from "next/link";
import { ShoppingCart, Menu, X, Pizza, Heart, LayoutDashboard, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, usePromotionSettings } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import ScrollingBanner from "@/components/layout/ScrollingBanner"
import { variables } from "@/settings/config";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function BaseHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { getItemsCount } = useCart();
  const itemsCount = getItemsCount();

  useEffect(() => {
    setIsMounted(true);
  },[]);

  const currentPath = usePathname();
  const isActive = (path: string) => currentPath === path

  const navigation = [
    { name: "Accueil", href: "/", active: isActive("/") },
    { name: "Notre Carte", href: "/menu", active: isActive("/menu") },
    { name: "À propos", href: "/about", active: isActive("/about") },
    { name: "Contact", href: "/contact", active: isActive("/contact") },
  ]

  return (
    <div className="border-b bg-background backdrop-blur-md shadow-lg">
      <div className="grid grid-cols-3 lg:grid-cols-5 h-20 w-full px-4 md:px-8">
        {/* Logo avec animation */}
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative">
            <Pizza className="h-8 w-8 text-orange-600 transition-transform group-hover:rotate-12" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {variables.title}
            </span>
            <p className="text-xs text-gray-500 -mt-1">
              {variables.subtitle1} • {variables.subtitle2}
            </p>
          </div>
        </Link>

        {/* Navigation desktop avec indicateurs actifs */}
        <nav className="col-span-3 w-full hidden lg:flex items-center justify-center flex-grow space-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600"
            >
              <span className="relative z-10">{item.name}</span>
              <div className="absolute inset-0 rounded-lg bg-orange-50 opacity-0 transition-opacity group-hover:opacity-100" />
              {item.active && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-orange-600 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions avec badges et animations */}
        <div className="col-span-2 lg:col-span-1 flex items-center justify-end space-x-3">
          {/* Statut de livraison */}
          <div className="hidden xl:flex items-center space-x-2 text-sm">
            {(variables.deliveryEnabled || variables.clickAndCollectEnabled) && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {variables.deliveryEnabled ? "En Livraison disponible" : "En Click & Collect disponible"}
              </Badge>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="relative p-5 group">
              <Link href="/favorites">
                <Heart className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:fill-red-500" />
                <span className="sr-only">Favoris</span>
              </Link>
            </Button>

            {/* Menu utilisateur avec gestion de l'authentification */}
            <UserMenu />

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="relative group"
            >
              <Link href="/cart" className="p-5">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                  {isMounted && itemsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-bounce"
                    >
                      {itemsCount > 99 ? "99+" : itemsCount}
                    </Badge>
                  )}
                </div>
                {isMounted && <span className="sr-only">Panier ({itemsCount})</span>}
              </Link>
            </Button>

            {/* Menu mobile toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden relative p-5 hover:cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="relative flex items-center justify-center">
                <Menu
                  className={cn(
                    "absolute transition-all duration-300",
                    isMenuOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
                  )}
                />
                <X
                  className={cn(
                    "absolute transition-all duration-300",
                    isMenuOpen
                      ? "rotate-0 opacity-100"
                      : "-rotate-180 opacity-0"
                  )}
                />
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation mobile avec animation glissante */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-500 ease-out",
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="py-6 space-y-1">
          {navigation.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 text-sm text-right font-medium rounded-lg transition-all duration-200",
                "hover:bg-orange-50 hover:text-orange-600",
                item.active && "bg-orange-50 text-orange-600"
              )}
              onClick={() => setIsMenuOpen(false)}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: isMenuOpen
                  ? "slideInLeft 0.3s ease-out forwards"
                  : "none",
              }}
            >
              {item.active && (
                <div className="h-2 w-2 bg-orange-600 rounded-full" />
              )}
              <span className="ml-auto">{item.name}</span>
            </Link>
          ))}

          <Separator className="my-4" />

          {/* Actions mobile */}
          <div className="px-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Statut de livraison</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                Ouverte • 15-20min
              </Badge>
            </div>
            <Button
              asChild
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Link href="/menu">Commander maintenant</Link>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}

function FixedHeader() {
  // Charger les settings de promotion au démarrage
  usePromotionSettings();

  return (
    <header className={cn(
      "absolute top-0 z-50 w-full transform transition-transform duration-300",
    )}>
      <BaseHeader />
      <ScrollingBanner />
    </header>
  );
}

function ScrollingHeader() {
  const [currentScroll, setCurrentScroll] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScroll, setLastScroll] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setCurrentScroll(window.scrollY)
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrollingUp = currentScroll < lastScroll && currentScroll > 150;
      setIsScrolling(isScrollingUp);
      setLastScroll(currentScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentScroll, lastScroll]);

  return (
    <div className={cn(
      "fixed top-[0px] z-40 w-full border-b bg-background/80 backdrop-blur-md shadow-lg transform transition-transform duration-300",
      isScrolling ? "translate-y-0" : "translate-y-[-150px]"
    )}>
      <ScrollingBanner />
      <BaseHeader />
    </div>
  )
}

function Header() {
  return (
    <>
      <FixedHeader />
      <ScrollingHeader />
    </>
  );
}

// Composant AdminHeader pour l'administration
export function AdminHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPath = usePathname();
  const isActive = (path: string) => currentPath === path;

  const navigation = [
    { name: "Tableau de Bord", href: "/admin", active: isActive("/admin") },
    {
      name: "Commandes",
      href: "/admin/orders",
      active: currentPath.startsWith("/admin/orders"),
    },
    {
      name: "Produits",
      href: "/admin/products",
      active: currentPath.startsWith("/admin/products"),
      children: [
        { name: "Gérer les produits", href: "/admin/products", active: isActive("/admin/products") },
        { name: "Ajouter un produit", href: "/admin/products/add", active: isActive("/admin/products/add") },
        { name: "Ajouter un menu", href: "/admin/menus/add", active: isActive("/admin/menus/add") },
      ]
    },
    {
      name: "Utilisateurs",
      href: "/admin/users",
      active: currentPath.startsWith("/admin/users"),
    },
    {
      name: "Notifications",
      href: "/admin/notifications",
      active: currentPath.startsWith("/admin/notifications"),
    },
    {
      name: "Infos",
      href: "/admin/infos",
      active: currentPath.startsWith("/admin/infos"),
    },
  ];

  return (
    <header className="border-b bg-background backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="h-16 w-full px-4 md:px-8 flex items-center">
        {/* Logo */}
        <Link href="/admin" className="group flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6 text-orange-600 transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden lg:flex items-center ml-auto mr-auto space-x-1">
          {navigation.map((item) => (
            <React.Fragment key={item.name}>
              {item.children ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600",
                        item.active && "bg-orange-50 text-orange-600"
                      )}
                    >
                      {item.name} <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.name} asChild>
                        <Link href={child.href} className={cn(
                          "block w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors duration-200 cursor-pointer",
                          "hover:bg-orange-50 hover:text-orange-600",
                          child.active && child.href === '/admin/products' ? "bg-orange-50 font-medium" : "",
                          child.active && child.href !== '/admin/products' && "font-medium"
                        )}>
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600",
                    item.active && "bg-orange-50 text-orange-600"
                  )}
                >
                  {item.name}
                  {item.active && (
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-orange-600 rounded-full" />
                  )}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-out",
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="py-4 space-y-1">
          {navigation.map((item) => (
            <React.Fragment key={item.name}>
              {item.children ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left px-4 py-3 text-sm font-medium transition-colors hover:text-orange-600",
                      item.active && "bg-orange-50 text-orange-600"
                    )}
                    onClick={() => setIsMenuOpen(false)} // Close menu on click
                  >
                    {item.name} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="ml-4 border-l pl-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "block px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600",
                          child.active && "text-orange-600 font-medium"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                    "hover:bg-orange-50 hover:text-orange-600",
                    item.active && "bg-orange-50 text-orange-600"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        <Separator className="my-4" />
        <UserMenu />
      </div>
    </header>
  );
}

export default Header;
