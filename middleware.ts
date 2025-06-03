import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Récupérer la session avec les headers de la requête
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // 1. Protéger les routes /admin pour les admins seulement
    if (pathname.startsWith("/admin")) {
      if (!session) {
        // Pas connecté -> rediriger vers login avec callback
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(
          new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
        );
      }

      if (session.user.role !== "admin") {
        // Connecté mais pas admin -> rediriger vers accueil avec message d'erreur
        return NextResponse.redirect(
          new URL("/?error=access_denied", request.url)
        );
      }
    }

    // 2. Rediriger les utilisateurs connectés qui tentent d'accéder aux routes /auth
    if (pathname.startsWith("/auth") && session) {
      // Vérifier s'il y a une URL de callback
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

      if (callbackUrl) {
        // Rediriger vers l'URL de callback
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }

      // Rediriger vers le dashboard admin si admin, sinon vers l'accueil
      const redirectTo = session.user.role === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erreur middleware:", error);

    // En cas d'erreur, laisser passer pour les routes publiques
    // Mais bloquer les routes admin par sécurité
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  // Spécifier les routes sur lesquelles le middleware s'applique
  matcher: [
    "/admin/:path*", // Toutes les routes admin
    "/auth/:path*", // Toutes les routes auth
  ],
};
