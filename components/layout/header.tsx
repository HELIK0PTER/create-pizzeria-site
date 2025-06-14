"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Pizza, Heart } from "lucide-react";
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
        <nav className="col-span-3 w-full hidden lg:flex items-center justify-center space-x-1">
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
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const adminNavigation = [
    { name: "Dashboard", href: "/admin", active: pathname === "/admin" },
    { name: "Produits", href: "/admin/products", active: pathname.startsWith("/admin/products") },
    { name: "Commandes", href: "/admin/orders", active: pathname.startsWith("/admin/orders") },
    { name: "Utilisateurs", href: "/admin/users", active: pathname.startsWith("/admin/users") },
    { name: "Notifications", href: "/admin/notifications", active: pathname.startsWith("/admin/notifications") },
    { name: "Paramètres", href: "/admin/infos", active: pathname.startsWith("/admin/infos") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Admin */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="relative">
                <Pizza className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                <div className="absolute -top-1 -right-1 h-2 w-2 md:h-3 md:w-3 bg-red-500 rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">{variables.title}</h1>
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            </Link>
          </div>

          {/* Navigation Admin Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  item.active
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/menu">
                <Pizza className="h-4 w-4 mr-2" />
                {`Voir le site`}
              </Link>
            </Button>

            {/* Menu mobile toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden relative p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="relative flex items-center justify-center w-5 h-10">
                <Menu
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMenuOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
                  )}
                />
                <X
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMenuOpen
                      ? "rotate-0 opacity-100"
                      : "-rotate-180 opacity-0"
                  )}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Navigation mobile */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-out",
            isMenuOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          <nav className="py-2 space-y-1">
            {adminNavigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  item.active
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                )}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-2 mt-2 border-t">
              <Link
                href="/menu"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Pizza className="h-4 w-4 mr-2" />
                {`Voir le site`}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
