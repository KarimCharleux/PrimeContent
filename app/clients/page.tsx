'use client';

import { collection, getDocs } from 'firebase/firestore';
import { gsap } from 'gsap';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid, { Project, ClientData } from '../components/PortfolioGrid/PortfolioGrid';

import './clients.scss';

interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    href: string;
    order?: number;
}

interface Client {
    id?: string;
    name: string;
    domain: string;
    imageSrc: string;
    imageBackground: string;
    href: string;
    order?: number;
}

interface MediaFile {
    name: string;
    path: string;
    type: 'image' | 'video';
    thumbnail?: string;
}

// Composant principal avec useSearchParams
function ClientPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Paramètres URL
    const urlType = searchParams?.get('type') || 'marques';
    const urlFilter = searchParams?.get('filter') || '';

    // États
    const [activeType, setActiveType] = useState<'marques' | 'celebrites'>(
        urlType as 'marques' | 'celebrites',
    );
    const [brands, setBrands] = useState<Brand[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs pour les animations
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const toggleRef = useRef<HTMLDivElement>(null);

    // Charger les médias d'un client spécifique
    const loadClientMedia = async (
        clientType: string,
        clientName: string,
    ): Promise<MediaFile[]> => {
        try {
            const basePath = `client/${clientType}/${clientName}`;
            const response = await fetch(
                `/api/gallery-images?path=${encodeURIComponent(basePath)}`,
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.media || data.images || [];
        } catch (error) {
            console.error(`Erreur lors du chargement des médias pour ${clientName}:`, error);
            return [];
        }
    };

    // Charger les vidéos (YouTube, Dailymotion, etc.) d'un client
    const loadClientVideos = async (
        clientType: 'brand' | 'celebrity',
        clientId: string,
    ): Promise<any[]> => {
        try {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            const { getVideoProvider, extractVideoId } = await import('../utils/videoManager');

            const videosCollection = collection(db, 'client-videos');
            const q = query(
                videosCollection,
                where('clientType', '==', clientType),
                where('clientId', '==', clientId),
            );
            const videosSnapshot = await getDocs(q);

            const videos: any[] = [];
            videosSnapshot.forEach((doc) => {
                const data = doc.data();

                // Support de rétrocompatibilité avec l'ancien format
                let provider = data.provider || 'youtube';
                let source = data.source || data.youtubeUrl || '';
                let videoId = data.videoId || data.youtubeId;

                // Si pas de provider défini, essayer de le détecter
                if (!data.provider && source) {
                    provider = getVideoProvider(source);
                    videoId = extractVideoId(source, provider);
                }

                videos.push({
                    id: doc.id,
                    title: data.title,
                    source,
                    provider,
                    videoId,
                    embedUrl: data.embedUrl,
                    watchUrl: data.watchUrl,
                    format: data.format, // ✅ Récupérer le format
                    order: data.order || 0,
                    // Propriétés de rétrocompatibilité
                    youtubeUrl: data.youtubeUrl,
                    youtubeId: data.youtubeId,
                });
            });

            return videos.sort((a, b) => a.order - b.order);
        } catch (error) {
            console.error(`Erreur lors du chargement des vidéos pour ${clientId}:`, error);
            return [];
        }
    };

    // Charger les données depuis Firebase et les médias
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Charger les marques
                const brandsCollection = collection(db, 'brands');
                const brandsSnapshot = await getDocs(brandsCollection);
                const fetchedBrands = brandsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Brand[];
                const sortedBrands = fetchedBrands.sort((a, b) => (a.order || 0) - (b.order || 0));
                setBrands(sortedBrands);

                // Charger les clients
                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);
                const fetchedClients = clientsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Client[];
                const sortedClients = fetchedClients.sort(
                    (a, b) => (a.order || 0) - (b.order || 0),
                );
                setClients(sortedClients);

                // Charger les médias pour toutes les marques
                const brandProjects: Project[] = [];
                for (const brand of sortedBrands) {
                    const brandName = brand.name.toLowerCase().replace(/\s+/g, '-');
                    const mediaFiles = await loadClientMedia('marques', brandName);

                    // Convertir chaque média en projet
                    mediaFiles.forEach((media, index) => {
                        brandProjects.push({
                            title: brand.name,
                            category: 'Marque',
                            source: `${media.path}/${media.name}`,
                            isVideo: media.type === 'video',
                            format: media.type === 'video' ? 'paysage' : 'paysage',
                            clientType: 'marque',
                            clientName: brandName,
                            thumbnail: media.thumbnail,
                        });
                    });

                    // Charger les vidéos (YouTube, Dailymotion, etc.) pour cette marque
                    if (brand.id) {
                        const videos = await loadClientVideos('brand', brand.id);
                        videos.forEach((video) => {
                            brandProjects.push({
                                title: `${brand.name} - ${video.title}`,
                                category: 'Marque',
                                source: video.source,
                                isVideo: true,
                                format: video.format || 'paysage', // ✅ Utiliser le format de la base de données
                                provider: video.provider,
                                videoId: video.videoId,
                                embedUrl: video.embedUrl,
                                watchUrl: video.watchUrl,
                                thumbnail: video.thumbnail, // ✅ Passer la miniature sauvegardée
                                clientType: 'marque',
                                clientName: brandName,
                                // Propriétés de rétrocompatibilité
                                isYouTube: video.provider === 'youtube',
                                youtubeId: video.provider === 'youtube' ? video.videoId : undefined,
                            });
                        });
                    }
                }

                // Charger les médias pour toutes les célébrités
                const clientProjects: Project[] = [];
                for (const client of sortedClients) {
                    const clientName = client.name.toLowerCase().replace(/\s+/g, '-');
                    const mediaFiles = await loadClientMedia('celebrites', clientName);

                    // Convertir chaque média en projet
                    mediaFiles.forEach((media, index) => {
                        clientProjects.push({
                            title: client.name,
                            category: 'Célébrité',
                            source: `${media.path}/${media.name}`,
                            isVideo: media.type === 'video',
                            format: media.type === 'video' ? 'paysage' : 'portrait',
                            clientType: 'celebrite',
                            clientName: clientName,
                            thumbnail: media.thumbnail,
                        });
                    });

                    // Charger les vidéos (YouTube, Dailymotion, etc.) pour cette célébrité
                    if (client.id) {
                        const videos = await loadClientVideos('celebrity', client.id);
                        videos.forEach((video) => {
                            clientProjects.push({
                                title: `${client.name} - ${video.title}`,
                                category: 'Célébrité',
                                source: video.source,
                                isVideo: true,
                                format: video.format || 'paysage', // ✅ Utiliser le format de la base de données
                                provider: video.provider,
                                videoId: video.videoId,
                                embedUrl: video.embedUrl,
                                watchUrl: video.watchUrl,
                                thumbnail: video.thumbnail, // ✅ Passer la miniature sauvegardée
                                clientType: 'celebrite',
                                clientName: clientName,
                                // Propriétés de rétrocompatibilité
                                isYouTube: video.provider === 'youtube',
                                youtubeId: video.provider === 'youtube' ? video.videoId : undefined,
                            });
                        });
                    }
                }

                setProjects([...brandProjects, ...clientProjects]);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Animation d'entrée
    useEffect(() => {
        if (!loading) {
            const tl = gsap.timeline();

            tl.fromTo(
                titleRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
            )
                .fromTo(
                    descriptionRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
                    '-=0.4',
                )
                .fromTo(
                    toggleRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
                    '-=0.3',
                );
        }
    }, [loading]);

    // Gérer le changement de type avec URL
    const handleTypeChange = (type: 'marques' | 'celebrites') => {
        setActiveType(type);

        // Mettre à jour l'URL
        const params = new URLSearchParams();
        params.set('type', type);
        if (urlFilter) {
            params.set('filter', urlFilter);
        }

        router.push(`/clients?${params.toString()}`, { scroll: false });
    };

    // Générer les filtres personnalisés basés sur les clients qui ont des médias
    const getAvailableFilters = () => {
        const currentProjects = projects.filter((project) =>
            activeType === 'marques'
                ? project.clientType === 'marque'
                : project.clientType === 'celebrite',
        );

        // Extraire les noms uniques des clients qui ont des médias
        const uniqueClients = Array.from(new Set(currentProjects.map((p) => p.clientName)));

        if (activeType === 'marques') {
            return brands
                .filter((brand) =>
                    uniqueClients.includes(brand.name.toLowerCase().replace(/\s+/g, '-')),
                )
                .map((brand) => ({
                    key: brand.name.toLowerCase().replace(/\s+/g, '-'),
                    label: brand.name,
                }));
        } else {
            return clients
                .filter((client) =>
                    uniqueClients.includes(client.name.toLowerCase().replace(/\s+/g, '-')),
                )
                .map((client) => ({
                    key: client.name.toLowerCase().replace(/\s+/g, '-'),
                    label: client.name.split(' ')[0], // Afficher seulement le prénom (premier mot)
                }));
        }
    };

    // Filtrer les projets selon le type actif
    const filteredProjects = projects.filter((project) =>
        activeType === 'marques'
            ? project.clientType === 'marque'
            : project.clientType === 'celebrite',
    );

    const customFilters = getAvailableFilters();
    console.log(customFilters);

    // Créer les données client pour les filtres avec images
    const createClientData = (): { [key: string]: ClientData } => {
        const clientData: { [key: string]: ClientData } = {};

        if (activeType === 'marques') {
            brands.forEach((brand) => {
                const key = brand.name.toLowerCase().replace(/\s+/g, '-');
                clientData[key] = {
                    name: brand.name,
                    imageSrc: brand.imageSrc,
                    type: 'brand',
                };
            });
        } else {
            clients.forEach((client) => {
                const key = client.name.toLowerCase().replace(/\s+/g, '-');
                clientData[key] = {
                    name: client.name,
                    imageSrc: client.imageSrc,
                    imageBackground: client.imageBackground,
                    type: 'celebrity',
                };
            });
        }

        return clientData;
    };

    if (loading) {
        return (
            <main className="client-page global-main-page">
                <Header />
                <section className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
                </section>
                <Footer />
            </main>
        );
    }

    return (
        <>
            <main className="client-page global-main-page">
                <Header />
                <section className="client-hero">
                    <div className="container mx-auto px-4 py-16">
                        <div className="text-center max-w-4xl mx-auto">
                            <h1 ref={titleRef} className="client-title">
                                Ils nous ont fait confiance
                            </h1>
                            <p ref={descriptionRef} className="client-description">
                                Découvrez les créations réalisées pour les marques prestigieuses et
                                célébrités qui nous ont fait confiance pour leurs projets de contenu
                                visuel.
                            </p>

                            {/* Toggle moderne */}
                            <div ref={toggleRef} className="client-toggle">
                                <div className="toggle-container">
                                    <button
                                        className={`toggle-btn ${activeType === 'marques' ? 'active' : ''}`}
                                        onClick={() => handleTypeChange('marques')}
                                    >
                                        Marques
                                    </button>
                                    <button
                                        className={`toggle-btn ${activeType === 'celebrites' ? 'active' : ''}`}
                                        onClick={() => handleTypeChange('celebrites')}
                                    >
                                        Célébrités
                                    </button>
                                    <div
                                        className={`toggle-slider ${activeType === 'celebrites' ? 'right' : 'left'}`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="client-gallery">
                    <div className="container mx-auto px-4 pb-16">
                        {filteredProjects.length > 0 ? (
                            <PortfolioGrid
                                projects={filteredProjects}
                                showFilter={customFilters.length > 0}
                                customFilters={customFilters}
                                activeFilter={urlFilter || 'Tout'}
                                onFilterChange={(filter) => {
                                    const params = new URLSearchParams();
                                    params.set('type', activeType);
                                    if (filter !== 'Tout') {
                                        params.set('filter', filter);
                                    }
                                    router.push(`/clients?${params.toString()}`, { scroll: false });
                                }}
                                filterWithImages={true}
                                clientData={createClientData()}
                                activeClientType={activeType}
                            />
                        ) : (
                            <div className="text-center py-16">
                                <div className="max-w-md mx-auto">
                                    <svg
                                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucun média disponible
                                    </h3>
                                    <p className="text-gray-500">
                                        Aucun média n&apos;a encore été ajouté pour les{' '}
                                        {activeType === 'marques' ? 'marques' : 'célébrités'}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                <Footer />
            </main>
        </>
    );
}

// Loading component pour Suspense
function ClientPageLoading() {
    return (
        <main className="client-page global-main-page">
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
            </div>
        </main>
    );
}

// Page principale avec Suspense
export default function ClientPage() {
    return (
        <Suspense fallback={<ClientPageLoading />}>
            <ClientPageContent />
        </Suspense>
    );
}
