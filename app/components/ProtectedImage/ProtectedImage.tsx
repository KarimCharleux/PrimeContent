'use client';

import Image, { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { getMediaUrl } from '../../utils/mediaUrl';

import styles from './ProtectedImage.module.scss';

interface ProtectedImageProps extends Omit<ImageProps, 'onContextMenu' | 'onDragStart' | 'src'> {
    /**
     * Chemin vers l'image
     */
    readonly src: string;
    /**
     * Forcer la protection même sur les pages admin (par défaut: false)
     */
    readonly forceProtection?: boolean;
}

export default function ProtectedImage({
    src,
    forceProtection = false,
    className = '',
    ...imageProps
}: ProtectedImageProps) {
    const pathname = usePathname();

    // Détecter si on est sur une page admin
    const isAdminPage = pathname?.startsWith('/backoffice');

    // Activer la protection seulement sur les pages publiques (ou si forcé)
    const shouldProtect = forceProtection || !isAdminPage;

    // Générer l'URL de l'image normale
    const imageUrl = getMediaUrl(src);

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
