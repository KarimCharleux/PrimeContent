'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getMediaUrl } from '../../utils/mediaUrl';

import styles from './ProtectedImage.module.scss';

interface ProtectedImageProps {
    /**
     * Chemin vers l'image
     */
    readonly src: string;
    /**
     * Texte alternatif pour l'image
     */
    readonly alt: string;
    /**
     * Largeur de l'image (ignoré si fill est true)
     */
    readonly width?: number;
    /**
     * Hauteur de l'image (ignoré si fill est true)
     */
    readonly height?: number;
    /**
     * Remplit le conteneur parent (comme next/image fill)
     */
    readonly fill?: boolean;
    /**
     * Classes CSS personnalisées
     */
    readonly className?: string;
    /**
     * Styles inline
     */
    readonly style?: React.CSSProperties;
    /**
     * Forcer la protection même sur les pages admin (par défaut: false)
     */
    readonly forceProtection?: boolean;
    /**
     * Qualité de l'image (1-100, par défaut: 90)
     */
    readonly quality?: number;
    /**
     * Mode de redimensionnement de l'image
     */
    readonly objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    /**
     * Tailles responsive pour next/image
     */
    readonly sizes?: string;
    /**
     * Priorité de chargement
     */
    readonly priority?: boolean;
    /**
     * Callback en cas d'erreur de chargement
     */
    readonly onError?: () => void;
    /**
     * Gestionnaire de clic
     */
    readonly onClick?: (e: React.MouseEvent) => void;
}

export default function ProtectedImage({
    src,
    alt,
    width = 400,
    height = 300,
    fill = false,
    className = '',
    style = {},
    forceProtection = false,
    quality = 90,
    objectFit = 'cover',
    sizes,
    priority = false,
    onError,
    onClick,
}: ProtectedImageProps) {
    const pathname = usePathname();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [canvasError, setCanvasError] = useState(false);

    // Détecter si on est sur une page admin
    const isAdminPage = pathname?.startsWith('/backoffice');

    // Activer la protection seulement sur les pages publiques (ou si forcé)
    const shouldProtect = forceProtection || !isAdminPage;

    // Générer l'URL de l'image normale
    const imageUrl = getMediaUrl(src);

    // Wrapper pour onError pour éviter les warnings ESLint
    const handleImageError = useCallback(() => {
        setImageError(true);
        if (onError) onError();
    }, [onError]);

    // Fallback vers image normale si canvas échoue
    const handleCanvasError = useCallback(() => {
        console.warn('Canvas échoué, fallback vers image normale');
        setCanvasError(true);
    }, []);

    // Calculer les dimensions effectives
    const actualWidth = fill ? '100%' : width;
    const actualHeight = fill ? '100%' : height;

    // Charger et dessiner l'image dans le canvas
    useEffect(() => {
        if (!shouldProtect || canvasError) return;
        if (!canvasRef.current) {
            handleCanvasError();
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            handleCanvasError();
            return;
        }

        // Dimensions du canvas
        let canvasWidth = width;
        let canvasHeight = height;

        if (fill) {
            const container = canvas.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                canvasWidth = rect.width || 400;
                canvasHeight = rect.height || 300;
            }
            // Forcer les dimensions du canvas
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        } else {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        }

        // Créer l'image
        const img = new window.Image();
        // Retirer crossOrigin pour éviter les erreurs CORS sur les images locales

        // Timeout pour éviter le chargement infini
        const timeout = setTimeout(() => {
            console.warn('Timeout de chargement image, fallback vers image normale');
            handleCanvasError();
        }, 10000); // 10 secondes

        img.onload = () => {
            try {
                // Annuler le timeout puisque l'image s'est chargée
                clearTimeout(timeout);

                // Effacer le canvas avant de dessiner
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                // Calculer les dimensions pour respecter l'objectFit
                const imgAspectRatio = img.width / img.height;
                const canvasAspectRatio = canvasWidth / canvasHeight;

                let drawWidth, drawHeight, drawX, drawY;

                switch (objectFit) {
                    case 'cover':
                        if (imgAspectRatio > canvasAspectRatio) {
                            drawHeight = canvasHeight;
                            drawWidth = drawHeight * imgAspectRatio;
                            drawX = (canvasWidth - drawWidth) / 2;
                            drawY = 0;
                        } else {
                            drawWidth = canvasWidth;
                            drawHeight = drawWidth / imgAspectRatio;
                            drawX = 0;
                            drawY = (canvasHeight - drawHeight) / 2;
                        }
                        break;
                    case 'contain':
                        if (imgAspectRatio > canvasAspectRatio) {
                            drawWidth = canvasWidth;
                            drawHeight = drawWidth / imgAspectRatio;
                            drawX = 0;
                            drawY = (canvasHeight - drawHeight) / 2;
                        } else {
                            drawHeight = canvasHeight;
                            drawWidth = drawHeight * imgAspectRatio;
                            drawX = (canvasWidth - drawWidth) / 2;
                            drawY = 0;
                        }
                        break;
                    case 'fill':
                    default:
                        drawWidth = canvasWidth;
                        drawHeight = canvasHeight;
                        drawX = 0;
                        drawY = 0;
                        break;
                }

                // Dessiner l'image
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // L'image est maintenant rendue dans le canvas
                // Le canvas est automatiquement "tainted" (protégé) car les images viennent de media.dalifilms.fr
                //setImageLoaded(true);
                setImageError(true);
            } catch (error) {
                console.error('Erreur lors du rendu canvas:', error);
                handleCanvasError();
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            handleImageError();
        };

        // Charger l'image
        img.src = imageUrl;

        return () => {
            clearTimeout(timeout);
        };
    }, [
        imageUrl,
        width,
        height,
        objectFit,
        shouldProtect,
        fill,
        handleImageError,
        handleCanvasError,
        canvasError,
    ]);

    // Gestionnaires de protection
    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            if (shouldProtect) {
                e.preventDefault();
                return false;
            }
        },
        [shouldProtect],
    );

    const handleDragStart = useCallback(
        (e: React.DragEvent) => {
            if (shouldProtect) {
                e.preventDefault();
                return false;
            }
        },
        [shouldProtect],
    );

    // Classes CSS pour la protection
    const protectionClasses = shouldProtect
        ? [styles.protected, styles.noSelect, styles.noDrag, styles.noRightClick].join(' ')
        : '';

    // Si pas de protection (mode admin) ou canvas échoué, utiliser une image normale
    if (!shouldProtect || canvasError) {
        return (
            <Image
                src={imageUrl}
                alt={alt}
                {...(fill ? { fill: true } : { width, height })}
                className={className}
                style={style}
                quality={quality}
                sizes={sizes}
                priority={priority}
                onError={onError}
                onClick={onClick}
            />
        );
    }

    // Mode protégé avec canvas
    return (
        <div
            className={`${styles.container} ${protectionClasses}`}
            style={fill ? { position: 'relative', width: '100%', height: '100%' } : {}}
        >
            <canvas
                ref={canvasRef}
                {...(!fill ? { width, height } : {})}
                className={`${styles.image} ${className}`}
                style={{
                    ...style,
                    ...(fill
                        ? {
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                          }
                        : {}),
                }}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                onClick={onClick}
                draggable={false}
                data-protected="true"
            />

            {/* Message de chargement */}
            {!imageLoaded && !imageError && (
                <div className={styles.loading}>
                    <span className={styles.loadingSpinner} aria-label="Chargement" />
                </div>
            )}

            {/* Message d'erreur */}
            {imageError && (
                <div className={styles.error}>
                    {/* Icône d'erreur simple, accessible */}
                    <span role="img" aria-label="Erreur">
                        ⚠️
                    </span>
                </div>
            )}

            {/* Overlay transparent pour bloquer les interactions */}
            <div className={styles.protectionOverlay} />
        </div>
    );
}
