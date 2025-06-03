import Link from "next/link";
import {
  Pizza,
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Globe,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Notre Menu", href: "/menu" },
    { name: "À propos", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const legalLinks = [
    { name: "Mentions légales", href: "/legal" },
    { name: "Politique de confidentialité", href: "/privacy" },
    { name: "CGV", href: "/terms" },
    { name: "Administration", href: "/admin", icon: Shield },
  ];

  const socialLinks = [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Instagram", href: "#", icon: Instagram },
    { name: "Site web", href: "#", icon: Globe },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Section principale */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative">
                <Pizza className="h-8 w-8 text-orange-500 transition-transform group-hover:rotate-12" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Bella Pizza
                </span>
                <p className="text-xs text-gray-400 -mt-1">
                  Authentique • Délicieux
                </p>
              </div>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Les meilleures pizzas artisanales de la ville, préparées avec des
              ingrédients frais et de qualité. Livraison rapide et click &
              collect disponibles.
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-800 text-green-200"
              >
                <Clock className="h-3 w-3 mr-1" />
                Ouvert maintenant
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Navigation</h3>
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Rue de la Pizza
                  <br />
                  75001 Paris, France
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <Link
                  href="tel:0123456789"
                  className="text-gray-300 hover:text-orange-400 transition-colors"
                >
                  01 23 45 67 89
                </Link>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <Link
                  href="mailto:contact@bellapizza.fr"
                  className="text-gray-300 hover:text-orange-400 transition-colors"
                >
                  contact@bellapizza.fr
                </Link>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <div className="text-gray-300">
                  <div>Lun-Dim: 11h30 - 23h00</div>
                  <div className="text-xs text-gray-400">
                    Livraison jusqu&apos;à 22h30
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux et liens */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Suivez-nous</h3>
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-gray-300 hover:text-orange-400 hover:bg-gray-800"
                  >
                    <Link href={social.href}>
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{social.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="text-sm font-medium text-gray-200">
                Liens utiles
              </h4>
              {legalLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center space-x-2 text-xs text-gray-400 hover:text-orange-400 transition-colors duration-200"
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Section copyright */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-400">
            © {currentYear} Bella Pizza. Tous droits réservés.
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Fait avec ❤️ pour les amateurs de pizza</span>
            <Separator orientation="vertical" className="h-4 bg-gray-600" />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-gray-500 hover:text-orange-400 p-0 h-auto"
            >
              <Link href="/admin" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
