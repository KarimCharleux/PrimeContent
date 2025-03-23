import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware pour sécuriser les routes administratives
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const requestHeaders = new Headers(request.headers);

  // Vérifier si l'utilisateur accède à une route protégée
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  // Exception pour la page de login admin
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  
  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (isAdminRoute && !session && !isLoginPage) {
    const redirectUrl = new URL('/admin/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Si l'utilisateur est déjà authentifié et essaie d'accéder à la page de login
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configuration des routes pour lesquelles le middleware doit s'exécuter
export const config = {
  matcher: ['/admin/:path*'],
}; 