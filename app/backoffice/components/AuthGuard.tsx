'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  readonly children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Si on est sur la page de login, pas besoin de vérifier
    if (pathname.includes('/backoffice/login')) {
      // Si l'utilisateur est déjà connecté, on le redirige vers le dashboard
      if (user && !loading) {
        router.push('/backoffice/dashboard');
      } else {
        setIsAuthorized(true);
      }
      return;
    }

    // Pour toutes les autres routes backoffice, vérifier si l'utilisateur est connecté
    if (!loading) {
      if (!user) {
        // Utilisateur non connecté, rediriger vers la page de login
        const redirectUrl = `/backoffice/login?callbackUrl=${encodeURIComponent(pathname || '/backoffice/dashboard')}`;
        router.push(redirectUrl);
      } else {
        // Utilisateur connecté, il est autorisé
        setIsAuthorized(true);
      }
    }
  }, [user, loading, pathname, router]);

  // Afficher un indicateur de chargement pendant la vérification
  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si autorisé, afficher le contenu
  return isAuthorized ? <>{children}</> : null;
} 