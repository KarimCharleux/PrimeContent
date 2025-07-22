'use client';

import Image, { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { getAutoWatermarkUrl } from '../../utils/mediaUrl';

import styles from './ProtectedImage.module.scss';

interface ProtectedImageProps extends Omit<ImageProps, 'onContextMenu' | 'onDragStart' | 'src'> {
    /**
     * Chemin vers l'image (sera automatiquement traité avec watermark si nécessaire)
     */
    src: string;
    /**
     * Activer/désactiver le watermark (par défaut: true sur les pages publiques)
     */
    showWatermark?: boolean;
    /**
     * Position du watermark (par défaut: "bottom-right")
     */
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    /**
     * Qualité de l'image avec watermark (par défaut: 90)
     */
    watermarkQuality?: number;
    /**
     * Forcer la protection même sur les pages admin (par défaut: false)
     */
    forceProtection?: boolean;
}

export default function ProtectedImage({
    src,
    showWatermark = true,
    watermarkPosition = 'bottom-right',
    watermarkQuality = 90,
    forceProtection = false,
    className = '',
    ...imageProps
}: ProtectedImageProps) {
    const pathname = usePathname();

    // Détecter si on est sur une page admin
    const isAdminPage = pathname?.startsWith('/backoffice');

    // Activer la protection seulement sur les pages publiques (ou si forcé)
    const shouldProtect = forceProtection || !isAdminPage;

    // Générer l'URL de l'image avec ou sans watermark
    const imageUrl = getAutoWatermarkUrl(src, {
        position: watermarkPosition,
        quality: watermarkQuality,
        skipWatermark: !showWatermark,
    });

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

    return (
        <div className={`${styles.container} ${protectionClasses}`}>
            <Image
                {...imageProps}
                src={imageUrl}
                alt={imageProps.alt || ''}
                className={`${styles.image} ${className}`}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                draggable={false}
            />

            {/* Overlay transparent pour bloquer les interactions */}
            {shouldProtect && <div className={styles.protectionOverlay} />}
        </div>
    );
}
