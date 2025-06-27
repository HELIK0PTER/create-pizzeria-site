import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Route temporaire pour déboguer les variables d'environnement en production
  const debugInfo = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    hasSecret: !!process.env.BETTER_AUTH_SECRET,
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent'),
    cookies: request.headers.get('cookie'),
    url: request.url,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo);
} 