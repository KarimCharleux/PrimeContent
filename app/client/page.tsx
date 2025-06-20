'use client';

import { collection, getDocs } from 'firebase/firestore';
import { gsap } from 'gsap';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid, { Project } from '../components/PortfolioGrid/PortfolioGrid';

import './client.scss';

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
                            title: `${brand.name} - ${media.name}`,
                            category: 'Marque',
                            source: `${media.path}/${media.name}`,
                            isVideo: media.type === 'video',
                            format: media.type === 'video' ? 'paysage' : 'paysage',
                            clientType: 'marque',
                            clientName: brandName,
                            thumbnail: media.thumbnail,
                        });
                    });
                }

                // Charger les médias pour toutes les célébrités
                const clientProjects: Project[] = [];
                for (const client of sortedClients) {
                    const clientName = client.name.toLowerCase().replace(/\s+/g, '-');
                    const mediaFiles = await loadClientMedia('celebrites', clientName);

                    // Convertir chaque média en projet
                    mediaFiles.forEach((media, index) => {
                        clientProjects.push({
                            title: `${client.name} - ${media.name}`,
                            category: 'Célébrité',
                            source: `${media.path}/${media.name}`,
                            isVideo: media.type === 'video',
                            format: media.type === 'video' ? 'paysage' : 'portrait',
                            clientType: 'celebrite',
                            clientName: clientName,
                            thumbnail: media.thumbnail,
                        });
                    });
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

        router.push(`/client?${params.toString()}`, { scroll: false });
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
                    label: client.name,
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

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="client-page global-main-page">
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
                                    router.push(`/client?${params.toString()}`, { scroll: false });
                                }}
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
            </main>
            <Footer />
        </>
    );
}

// Loading component pour Suspense
function ClientPageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
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
