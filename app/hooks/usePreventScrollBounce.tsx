'use client';

import { useEffect } from 'react';

import { isIOSSafari, isMobile } from '../utils/deviceDetection';

/**
 * Hook pour empêcher le scroll bounce et l'overscroll sur mobile
 * Complément aux styles CSS pour une protection maximale
 */
export const usePreventScrollBounce = () => {
    useEffect(() => {
        // Seulement sur mobile
        if (!isMobile()) return;

        let startY = 0;
        let startX = 0;

        // Empêche le scroll bounce sur iOS
        const preventDefault = (e: Event) => {
            e.preventDefault();
        };

        // Gestion du touchstart
        const handleTouchStart = (e: TouchEvent) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        };

        // Gestion du touchmove pour empêcher le scroll horizontal et le bounce vertical
        const handleTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;

            const deltaY = currentY - startY;
            const deltaX = currentX - startX;

            // Empêche le scroll horizontal si le mouvement est principalement horizontal
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
                return;
            }

            // Sur iOS, empêche le scroll au-delà des limites
            if (isIOSSafari()) {
                const isAtTop = window.scrollY <= 0;
                const isAtBottom =
                    window.scrollY >= document.documentElement.scrollHeight - window.innerHeight;

                // Empêche le pull-to-refresh (scroll vers le bas quand on est en haut)
                if (isAtTop && deltaY > 0) {
                    e.preventDefault();
                    return;
                }

                // Empêche le bounce en bas
                if (isAtBottom && deltaY < 0) {
                    e.preventDefault();
                    return;
                }
            }
        };

        // Empêche le pull-to-refresh sur Chrome mobile
        const handleTouchEnd = (e: TouchEvent) => {
            // Reset des valeurs
            startY = 0;
            startX = 0;
        };

        // Empêche les gestes de zoom accidentels
        const handleGestureStart = (e: Event) => {
            e.preventDefault();
        };

        // Empêche le menu contextuel sur iOS
        const handleContextMenu = (e: Event) => {
            if (isMobile()) {
                e.preventDefault();
            }
        };

        // Ajout des event listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Spécifique iOS
        if (isIOSSafari()) {
            document.addEventListener('gesturestart', handleGestureStart, { passive: false });
            document.addEventListener('gesturechange', preventDefault, { passive: false });
            document.addEventListener('gestureend', preventDefault, { passive: false });
        }

        // Empêche le menu contextuel sur mobile
        document.addEventListener('contextmenu', handleContextMenu, { passive: false });

        // Nettoyage
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);

            if (isIOSSafari()) {
                document.removeEventListener('gesturestart', handleGestureStart);
                document.removeEventListener('gesturechange', preventDefault);
                document.removeEventListener('gestureend', preventDefault);
            }

            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);
};

/**
 * Hook pour empêcher le zoom accidentel sur mobile
 */
export const usePreventZoom = () => {
    useEffect(() => {
        if (!isMobile()) return;

        const preventDefault = (e: Event) => {
            // Empêche le zoom sur double tap
            if ((e as any).detail > 1) {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Empêche Ctrl/Cmd + Zoom sur mobile (rare mais possible avec clavier bluetooth)
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
                e.preventDefault();
            }
        };

        document.addEventListener('click', preventDefault, { passive: false });
        document.addEventListener('keydown', handleKeyDown, { passive: false });

        return () => {
            document.removeEventListener('click', preventDefault);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
};

/**
 * Hook combiné pour une protection complète
 */
export const useMobileOptimization = () => {
    usePreventScrollBounce();
    usePreventZoom();
};
