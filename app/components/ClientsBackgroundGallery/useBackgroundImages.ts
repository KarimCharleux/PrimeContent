import { useState, useEffect, useCallback } from 'react';

import { getMediaUrl } from '@/app/utils/mediaUrl';

interface BackgroundImage {
    source: string;
    title: string;
    category: string;
    isVideo: false;
    format: 'paysage' | 'portrait';
    clientType: 'marque' | 'celebrite';
    clientName: string;
}

interface UseBackgroundImagesProps {
    activeType: 'marques' | 'celebrites';
    activeFilter: string;
}

/**
 * Hook personnalisé pour charger uniquement les images légères pour la galerie d'arrière-plan
 * Indépendant du PortfolioGrid pour éviter d'attendre le chargement des vidéos lourdes
 */
export const useBackgroundImages = ({ activeType, activeFilter }: UseBackgroundImagesProps) => {
    const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBackgroundImages = useCallback(async () => {
        console.log("🎨 [useBackgroundImages] Chargement des images d'arrière-plan:", {
            activeType,
            activeFilter,
        });

        setLoading(true);

        try {
            // Charger les images selon le type actif
            const clientType = activeType === 'marques' ? 'marques' : 'celebrites';

            let basePath = `client/${clientType}`;

            // Si un filtre spécifique est sélectionné
            if (activeFilter && activeFilter !== 'Tout') {
                basePath = `client/${clientType}/${activeFilter}`;
            }

            console.log('🎨 [useBackgroundImages] Chemin de recherche:', basePath);

            const response = await fetch(
                `/api/gallery-images?path=${encodeURIComponent(basePath)}`,
            );

            if (!response.ok) {
                console.error('🎨 [useBackgroundImages] Erreur API:', response.status);
                setBackgroundImages([]);
                return;
            }

            const data = await response.json();
            const mediaFiles = data.media || data.images || [];

            console.log('🎨 [useBackgroundImages] Médias trouvés:', {
                count: mediaFiles.length,
                files: mediaFiles.map((m: any) => ({ name: m.name, type: m.type })),
            });

            // Filtrer uniquement les images (pas les vidéos)
            const imageFiles = mediaFiles.filter((media: any) => media.type === 'image');

            console.log('🎨 [useBackgroundImages] Images filtrées:', {
                count: imageFiles.length,
                images: imageFiles.map((m: any) => m.name),
            });

            // Convertir en format BackgroundImage
            const images: BackgroundImage[] = imageFiles.map((media: any) => ({
                source: getMediaUrl(`${media.path}/${media.name}`),
                title: `Image ${activeType}`,
                category: activeType === 'marques' ? 'Marque' : 'Célébrité',
                isVideo: false as const,
                format: 'paysage' as const,
                clientType: activeType === 'marques' ? ('marque' as const) : ('celebrite' as const),
                clientName: activeFilter || 'all',
            }));

            console.log('🎨 [useBackgroundImages] Images finales:', {
                count: images.length,
                sources: images.map((img) => img.source),
            });

            setBackgroundImages(images);
        } catch (error) {
            console.error('🎨 [useBackgroundImages] Erreur lors du chargement:', error);
            setBackgroundImages([]);
        } finally {
            setLoading(false);
        }
    }, [activeType, activeFilter]);

    useEffect(() => {
        loadBackgroundImages();
    }, [loadBackgroundImages]);

    return {
        backgroundImages,
        loading,
    };
};
