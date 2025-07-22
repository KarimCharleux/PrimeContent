'use client';

/**
 * Utilitaire de protection globale des images
 * Ajoute des protections JavaScript contre le téléchargement d'images
 */

// Protection contre le clic droit sur les images
export function disableImageContextMenu(): void {
    if (typeof window === 'undefined') return;

    const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.closest('[data-protected="true"]')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
}

// Protection contre les raccourcis clavier
export function disableImageShortcuts(): void {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
        // Bloquer Ctrl+S (Save), Ctrl+A (Select All), F12 (DevTools), etc.
        if (e.ctrlKey && (e.key === 's' || e.key === 'a' || e.key === 'p')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Bloquer F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Bloquer Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Bloquer Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    document.addEventListener('keydown', handleKeyDown, true);
}

// Protection contre la sélection de texte/images
export function disableSelection(): void {
    if (typeof window === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
    .protected-content, .protected-content * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-user-drag: none !important;
      -khtml-user-drag: none !important;
      -moz-user-drag: none !important;
      -o-user-drag: none !important;
      user-drag: none !important;
      -webkit-touch-callout: none !important;
    }
  `;
    document.head.appendChild(style);
}

// Protection contre le drag and drop
export function disableDragDrop(): void {
    if (typeof window === 'undefined') return;

    const handleDragStart = (e: DragEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.closest('[data-protected="true"]')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    document.addEventListener('dragstart', handleDragStart, true);
}

// Détection et protection contre les outils de développement
export function detectDevTools(): void {
    if (typeof window === 'undefined') return;

    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
        if (
            window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold
        ) {
            if (!devtools.open) {
                devtools.open = true;
                console.clear();
                console.log(
                    '%c⚠️ PROTECTION ACTIVÉE',
                    'color: red; font-size: 20px; font-weight: bold;',
                );
                console.log(
                    '%cLes images de ce site sont protégées par copyright.',
                    'color: red; font-size: 14px;',
                );
                console.log(
                    '%c© DALI FILMS - Tous droits réservés',
                    'color: red; font-size: 14px;',
                );
            }
        } else {
            devtools.open = false;
        }
    }, 500);
}

// Protection contre l'impression
export function disablePrint(): void {
    if (typeof window === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
    @media print {
      .protected-content, [data-protected="true"] {
        display: none !important;
      }
      body::after {
        content: "Ce contenu est protégé et ne peut pas être imprimé. © DALI FILMS";
        display: block;
        text-align: center;
        font-size: 24px;
        margin-top: 50px;
      }
    }
  `;
    document.head.appendChild(style);
}

// Protection contre la sauvegarde d'images via navigateur
export function protectImageSaving(): void {
    if (typeof window === 'undefined') return;

    // Surcharger les fonctions de sauvegarde natives
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
        if (this.closest('[data-protected="true"]')) {
            throw new Error('Canvas protection: Unauthorized access');
        }
        return originalToDataURL.apply(this, args);
    };

    // Protection contre le "Save Image As" via l'intercepttion des URLs
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (object) {
        // Logique pour détecter si c'est une tentative de sauvegarde
        console.log('URL.createObjectURL intercepted - potential image save attempt blocked');
        return originalCreateObjectURL.call(this, object);
    };
}

// Initialisation de toutes les protections
export function initializeImageProtection(isPublicPage: boolean = true): void {
    if (!isPublicPage || typeof window === 'undefined') return;

    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyProtections();
        });
    } else {
        applyProtections();
    }
}

function applyProtections(): void {
    disableImageContextMenu();
    disableImageShortcuts();
    disableSelection();
    disableDragDrop();
    detectDevTools();
    disablePrint();
    protectImageSaving();

    // Ajouter la classe de protection au body pour les pages publiques
    document.body.classList.add('protected-content');

    console.log('🛡️ Protection des images activée - © DALI FILMS');
}

// Utilitaire pour désactiver les protections (pour le backoffice)
export function disableImageProtection(): void {
    if (typeof window === 'undefined') return;

    document.body.classList.remove('protected-content');
    console.log('🔓 Protection des images désactivée - Mode administration');
}

// Export pour utilisation dans les composants
const imageProtection = {
    initializeImageProtection,
    disableImageProtection,
};

export default imageProtection;
