# Mariages — Page de détail par couple Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer le filtrage in-page par une navigation vers `/mariages/[id]` où chaque couple a sa propre page avec modale de mot de passe (style events) et grille de photos + bouton téléchargement (style événement "paye").

**Architecture:** Nouvelle route Next.js App Router `app/mariages/[id]/` avec 3 fichiers client : `MariageDetailClient` (password gate + fetch couple), `MariagePage` (grille médias + download JSZip). La page listing `/mariages` est simplifiée : le clic sur un couple navigue vers `/mariages/[id]`, le filtrage par couple et la modale in-page sont supprimés.

**Tech Stack:** Next.js 14 App Router, Firebase Firestore Client SDK, framer-motion, JSZip + file-saver, PortfolioGrid, PrimaryButton

---

### Task 1 : SCSS + server component page.tsx

**Files:**
- Create: `app/mariages/[id]/mariageDetail.scss`
- Create: `app/mariages/[id]/page.tsx`

**Step 1 : Créer `mariageDetail.scss`**

Copier exactement les styles nécessaires de `app/evenements/evenements.scss` et `app/evenements/[id]/eventDetail.scss` :

```scss
// app/mariages/[id]/mariageDetail.scss

.mariage-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.mariage-header {
    padding: 20px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 20px;
}

.mariage-page-title {
    font-size: 2rem;
    font-weight: 800;
    text-align: center;
    letter-spacing: 2px;
    position: relative;
    text-shadow:
        0 2px 10px rgba(0, 0, 0, 0.8),
        0 4px 20px rgba(0, 0, 0, 0.6);

    a {
        font-size: 2.3rem;
        color: rgb(195, 195, 195);
        font-weight: 600;
        text-decoration: none;

        &:hover {
            color: #fff;
        }
    }
}

// Loader avec progression (copié de evenements.scss)
.photos-loader {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 200px;

    .loader-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        border-top-color: #fff;
        animation: mariageSpin 1s ease-in-out infinite;
        margin-bottom: 20px;
    }

    .loading-progress {
        width: 100%;
        max-width: 500px;
        margin-top: 20px;

        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;

            .progress-fill {
                height: 100%;
                background-color: #fff;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
        }

        .progress-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            text-align: center;
        }

        .progress-count {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
            margin: 10px 0;
        }
    }
}

// Modale mot de passe (identique à eventDetail.scss)
.mariage-password-modal-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 20px;
}

.mariage-password-modal {
    background-color: white;
    border-radius: 8px;
    padding: 30px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    animation: mariageFadeIn 0.3s ease-out;
    color: #000;
}

.mariage-modal-title {
    font-size: 24px;
    font-weight: 600;
    color: #000;
    margin-bottom: 16px;
}

.mariage-modal-description {
    font-size: 16px;
    color: #555;
    margin-bottom: 24px;
    line-height: 1.5;
}

.mariage-password-form {
    display: flex;
    flex-direction: column;
}

.mariage-password-input {
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    margin-bottom: 16px;
    transition: border-color 0.2s ease;

    &:focus {
        border-color: #000;
        outline: none;
    }
}

.mariage-password-error {
    color: #e53e3e;
    font-size: 14px;
    margin-bottom: 16px;
    animation: mariageShake 0.5s ease-in-out;
}

.mariage-password-submit {
    padding: 12px 24px;
    background-color: #000;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: #333;
    }

    &:disabled {
        background-color: #ccc;
        color: #666;
        cursor: not-allowed;
        opacity: 0.7;
    }
}

@keyframes mariageSpin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes mariageFadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes mariageShake {
    0%,
    100% {
        transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
        transform: translateX(-5px);
    }
    20%,
    40%,
    60%,
    80% {
        transform: translateX(5px);
    }
}
```

**Step 2 : Créer `app/mariages/[id]/page.tsx`**

```tsx
// app/mariages/[id]/page.tsx
import { Suspense } from 'react';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import MariageDetailClient from './MariageDetailClient';

export default async function MariageDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <main className="global-main-page">
            <Header />
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-20">
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                border: '3px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                borderTopColor: '#fff',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                    </div>
                }
            >
                <MariageDetailClient coupleId={id} />
            </Suspense>
            <Footer />
        </main>
    );
}
```

**Step 3 : Lint**

```bash
npm run lint
```

**Step 4 : Commit**

```bash
git add app/mariages/[id]/mariageDetail.scss app/mariages/[id]/page.tsx
git commit -m "feat(mariages): ajouter route /mariages/[id] — scss et page serveur"
```

---

### Task 2 : MariageDetailClient (password gate + fetch couple)

**Files:**
- Create: `app/mariages/[id]/MariageDetailClient.tsx`

**Step 1 : Créer le composant**

```tsx
// app/mariages/[id]/MariageDetailClient.tsx
'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import './mariageDetail.scss';
import MariagePage from './MariagePage';

interface Couple {
    id: string;
    coupleDisplayName: string;
    person1Name: string;
    person2Name: string;
    person1Image: string;
    person2Image: string;
    password?: string;
}

interface MariageDetailClientProps {
    readonly coupleId: string;
}

export default function MariageDetailClient({ coupleId }: MariageDetailClientProps) {
    const [couple, setCouple] = useState<Couple | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const fetchCouple = async () => {
            try {
                const docRef = doc(db, 'couples', coupleId);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    setError('Ce mariage est introuvable.');
                    setLoading(false);
                    return;
                }
                const coupleData = { id: docSnap.id, ...docSnap.data() } as Couple;
                setCouple(coupleData);
                if (coupleData.password) {
                    setShowPasswordModal(true);
                } else {
                    setAuthenticated(true);
                }
            } catch (err) {
                console.error('Erreur chargement couple:', err);
                setError('Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };
        fetchCouple();
    }, [coupleId]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (couple && password === couple.password) {
            setShowPasswordModal(false);
            setPasswordError(null);
            setPassword('');
            setAuthenticated(true);
        } else {
            setPasswordError('Mot de passe incorrect. Veuillez réessayer.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="photos-loader">
                    <div className="loader-spinner" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    if (showPasswordModal && couple) {
        return (
            <div className="mariage-password-modal-container">
                <div className="mariage-password-modal">
                    <h2 className="mariage-modal-title">Mariage protégé</h2>
                    <p className="mariage-modal-description">
                        Ce mariage est protégé par un mot de passe. Veuillez saisir le mot de passe
                        pour accéder aux photos.
                    </p>
                    <form onSubmit={handlePasswordSubmit} className="mariage-password-form">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mot de passe"
                            className="mariage-password-input"
                            autoFocus
                        />
                        {passwordError && (
                            <div className="mariage-password-error">{passwordError}</div>
                        )}
                        <button type="submit" className="mariage-password-submit">
                            Accéder aux photos
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (authenticated && couple) {
        return <MariagePage couple={couple} />;
    }

    return null;
}
```

**Step 2 : Lint**

```bash
npm run lint
```

**Step 3 : Commit**

```bash
git add app/mariages/[id]/MariageDetailClient.tsx
git commit -m "feat(mariages): MariageDetailClient — password gate et fetch couple"
```

---

### Task 3 : MariagePage (grille médias + téléchargement)

**Files:**
- Create: `app/mariages/[id]/MariagePage.tsx`

**Step 1 : Créer le composant**

La logique de download est identique à `EventPage.handleDownloadAllPhotos` mais adapée aux `coupleMedias` (champ `url` au lieu de `path`).

```tsx
// app/mariages/[id]/MariagePage.tsx
'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import PortfolioGrid from '../../components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from '../../components/PrimaryButton';
import { getMediaUrl } from '../../utils/mediaUrl';

interface Couple {
    id: string;
    coupleDisplayName: string;
    person1Name: string;
    person2Name: string;
    person1Image: string;
    person2Image: string;
    password?: string;
}

interface CoupleMedia {
    id: string;
    coupleId: string;
    type: 'photo' | 'video';
    url: string;
    filename: string;
    title?: string;
    order: number;
}

interface CoupleVideo {
    id: string;
    coupleId: string;
    type: 'youtube' | 'dailymotion';
    videoId: string;
    title: string;
    thumbnail?: string;
    embedUrl: string;
    watchUrl: string;
    format?: 'portrait' | 'paysage';
}

interface MediaProject {
    title: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'paysage' | 'portrait';
    provider?: 'youtube' | 'dailymotion' | 'local';
    videoId?: string;
    embedUrl?: string;
    watchUrl?: string;
    thumbnail?: string;
    _downloadUrl?: string;
}

interface MariagePageProps {
    readonly couple: Couple;
}

const detectFormat = (filename: string): 'paysage' | 'portrait' => {
    const name = filename.toLowerCase();
    if (['portrait', 'vertical', 'vert', 'tall', 'standing', 'debout'].some((k) => name.includes(k)))
        return 'portrait';
    if (['paysage', 'landscape', 'horizontal', 'horiz', 'wide', 'large'].some((k) => name.includes(k)))
        return 'paysage';
    return 'portrait';
};

export default function MariagePage({ couple }: MariagePageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<MediaProject[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadedCount, setLoadedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (initialLoadDone.current) return;
        setTimeout(() => setShouldStartAnimations(true), 100);

        const fetchAndLoad = async () => {
            try {
                // 1. Charger les photos/vidéos locales du couple
                const mediaSnap = await getDocs(
                    query(collection(db, 'coupleMedias'), where('coupleId', '==', couple.id)),
                );
                const coupleMedias = mediaSnap.docs
                    .map((d) => ({ id: d.id, ...d.data() } as CoupleMedia))
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                // 2. Charger les vidéos externes (YouTube/Dailymotion)
                const videosSnap = await getDocs(
                    query(collection(db, 'coupleVideos'), where('coupleId', '==', couple.id)),
                );
                const coupleVideos = videosSnap.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as CoupleVideo),
                );

                const photos = coupleMedias.filter((m) => m.type === 'photo');
                const localVideos = coupleMedias.filter((m) => m.type === 'video');
                setTotalCount(coupleMedias.length + coupleVideos.length);

                const loaded: MediaProject[] = [];
                let count = 0;

                // Précharger les photos pour afficher la progression
                for (const media of photos) {
                    await new Promise<void>((resolve) => {
                        const img = new window.Image();
                        img.src = getMediaUrl(media.url);
                        img.onload = img.onerror = () => {
                            count++;
                            setLoadedCount(count);
                            setLoadingProgress(
                                Math.round((count / Math.max(photos.length, 1)) * 100),
                            );
                            resolve();
                        };
                    });
                    loaded.push({
                        title: media.title || couple.coupleDisplayName,
                        category: couple.coupleDisplayName,
                        source: media.url,
                        isVideo: false,
                        format: detectFormat(media.filename),
                        _downloadUrl: media.url,
                    });
                }

                // Vidéos locales (pas de préchargement)
                for (const media of localVideos) {
                    loaded.push({
                        title: media.title || couple.coupleDisplayName,
                        category: couple.coupleDisplayName,
                        source: media.url,
                        isVideo: true,
                        format: detectFormat(media.filename),
                        provider: 'local',
                    });
                }

                // Vidéos externes
                for (const video of coupleVideos) {
                    loaded.push({
                        title: video.title,
                        category: couple.coupleDisplayName,
                        source: video.watchUrl,
                        isVideo: true,
                        format: video.format || 'paysage',
                        thumbnail: video.thumbnail,
                        provider: video.type,
                        videoId: video.videoId,
                        embedUrl: video.embedUrl,
                        watchUrl: video.watchUrl,
                    });
                }

                if (loaded.length === 0) {
                    setErrorMessage('Aucun média trouvé pour ce mariage.');
                }

                setProjects(loaded);
                setShouldStartAnimations(true);
                initialLoadDone.current = true;
            } catch (err) {
                console.error('Erreur chargement médias mariage:', err);
                setErrorMessage('Erreur lors du chargement des médias.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndLoad();
    }, [couple]);

    // Même logique que EventPage.buildDownloadUrl
    const buildDownloadUrl = (url: string): string => {
        if (!url || url.startsWith('blob:')) return url;
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return `/api/download-media?path=${encodeURIComponent('/' + cleanPath)}`;
    };

    // Même logique que EventPage.handleDownloadAllPhotos (type "paye")
    const handleDownloadAllPhotos = () => {
        if (isDownloadingZip) return;
        const photoProjects = projects.filter((p) => !p.isVideo && p._downloadUrl);
        if (photoProjects.length === 0) {
            alert('Aucune photo à télécharger.');
            return;
        }

        const startDownload = async () => {
            setIsDownloadingZip(true);
            setDownloadProgress(0);
            const zip = new JSZip();
            const folder = zip.folder('photos');
            let completed = 0;

            for (const project of photoProjects) {
                try {
                    const response = await fetch(buildDownloadUrl(project._downloadUrl!));
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    const filename =
                        project._downloadUrl!.split('/').pop() || `photo-${completed}.jpg`;
                    folder?.file(filename, blob);
                } catch (e) {
                    console.error('Erreur téléchargement:', project._downloadUrl, e);
                } finally {
                    completed++;
                    setDownloadProgress(Math.round((completed / photoProjects.length) * 100));
                }
            }

            const safeTitle = couple.coupleDisplayName
                .normalize('NFD')
                .replace(/[^\w\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase();

            const content = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 },
            });
            saveAs(content, `${safeTitle}-photos.zip`);
        };

        void startDownload().finally(() => {
            setIsDownloadingZip(false);
            setDownloadProgress(0);
        });
    };

    return (
        <div className="mariage-detail-container">
            <div className="mariage-header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="title-container relative overflow-hidden !m-0"
                >
                    <motion.h2
                        className="mariage-page-title underline-title"
                        initial={{ opacity: 0 }}
                        animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Link href="/mariages">Mariages</Link> / {couple.coupleDisplayName}
                    </motion.h2>
                </motion.div>
            </div>

            {/* Bouton télécharger fixe en bas — même pattern que EventPage (type "paye") */}
            <motion.div
                className="pb-5"
                initial={{ opacity: 0, y: 20 }}
                animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <PrimaryButton
                        text={
                            isDownloadingZip
                                ? `Téléchargement... ${downloadProgress}%`
                                : 'Télécharger toutes les photos'
                        }
                        onClick={handleDownloadAllPhotos}
                        animateOnMount={true}
                        delay={0.5}
                    />
                </div>
            </motion.div>

            {isLoading ? (
                <motion.div
                    className="photos-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="loader-spinner" />
                    <div className="loading-progress">
                        <div className="progress-count">
                            {loadedCount}/{totalCount}
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            Chargement des médias : {loadingProgress}%
                        </div>
                    </div>
                </motion.div>
            ) : errorMessage ? (
                <motion.div
                    className="flex items-center justify-center py-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-gray-400">{errorMessage}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <PortfolioGrid projects={projects} showFilter={false} />
                </motion.div>
            )}
        </div>
    );
}
```

**Step 2 : Lint**

```bash
npm run lint
```

**Step 3 : Commit**

```bash
git add app/mariages/[id]/MariagePage.tsx
git commit -m "feat(mariages): MariagePage — grille médias, preload et téléchargement ZIP"
```

---

### Task 4 : Simplifier `app/mariages/page.tsx`

**Files:**
- Modify: `app/mariages/page.tsx`

**Step 1 : Remplacer le contenu de `MariagesContent`**

Supprimer : filtrage par couple (`activeFilter`, `handleFilterChange`, query params `?couple=`), toute la logique de modale password (`pendingCouple`, `pendingPassword`, `showPasswordModal`, `passwordInput`, `passwordError`, `handlePasswordSubmit`, `handleCoupleClick`).

Ajouter : `router.push('/mariages/' + testimonial.id)` au clic sur une carte couple.

La page garde : le portfolio grid avec les médias généraux (via `useMariagesData`), la section testimonials avec les cartes couples devenues des liens.

Nouveau contenu complet du fichier :

```tsx
'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';
import { useMariagesData, MariageTestimonial } from '../hooks/useMariagesData';
import './mariages.scss';
import { getMediaUrl } from '../utils/mediaUrl';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3,
        },
    },
};

function MariagesContent() {
    const router = useRouter();
    const { portfolioData, testimonialsData, loading: dataLoading, error } = useMariagesData();
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!dataLoading) {
            setTimeout(() => setIsLoading(false), 600);
        }

        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            if (splashScreenComplete === 'true') {
                setShouldStartAnimations(true);
                localStorage.removeItem('splashScreenComplete');
                window.scrollTo(0, 0);
            } else if (splashScreenComplete !== 'waiting') {
                setTimeout(() => setShouldStartAnimations(true), 100);
            }
        };

        checkSplashScreen();
        const interval = setInterval(checkSplashScreen, 100);
        return () => clearInterval(interval);
    }, [dataLoading]);

    const handleCoupleClick = (testimonial: MariageTestimonial) => {
        router.push('/mariages/' + testimonial.id);
    };

    return (
        <main className="global-main-page">
            <Header />
            <section className="hero-section text-center py-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="title-container relative overflow-hidden"
                >
                    <motion.h1
                        className="page-title underline-title"
                        initial={{ opacity: 0 }}
                        animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        MARIAGES
                    </motion.h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-3xl mx-auto page-subtitle text-gray-200"
                >
                    Immortalisez votre grand jour avec des photos inoubliables ✨
                </motion.p>

                <div className="container mx-auto">
                    {isLoading || dataLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={fadeInUp}
                            className="portfolio-container"
                        >
                            <PortfolioGrid
                                projects={portfolioData}
                                showFilter={false}
                                enablePagination={true}
                                itemsPerPageDesktop={24}
                                itemsPerPageMobile={12}
                                enableRandomShuffle={false}
                            />
                        </motion.div>
                    )}
                </div>
            </section>

            <section className="testimonials-section">
                <motion.div
                    className="testimonials-grid"
                    initial="hidden"
                    animate={shouldStartAnimations ? 'visible' : 'hidden'}
                    variants={staggerContainer}
                >
                    {testimonialsData.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            className="testimonial-card"
                            variants={fadeInUp}
                            custom={index}
                            onClick={() => handleCoupleClick(testimonial)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="couple-images">
                                <Image
                                    src={getMediaUrl(testimonial.coupleImages.person1)}
                                    alt={`Photo de ${testimonial.coupleName.split(' & ')[0]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                                <Image
                                    src={getMediaUrl('/mariages/link.svg')}
                                    alt="Link"
                                    width={116}
                                    height={78}
                                    className="h-20 w-28"
                                />
                                <Image
                                    src={getMediaUrl(testimonial.coupleImages.person2)}
                                    alt={`Photo de ${testimonial.coupleName.split(' & ')[1]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                            </div>
                            <div className="text-base md:text-lg font-semibold mb-4 text-white">
                                {testimonial.coupleName}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            <Footer />
        </main>
    );
}

function MariagesPageFallback() {
    return (
        <main className="global-main-page">
            <Header />
            <section className="hero-section text-center py-16">
                <div className="title-container relative overflow-hidden">
                    <h1 className="page-title underline-title">MARIAGES</h1>
                </div>
                <p className="max-w-3xl mx-auto page-subtitle text-gray-200">
                    Immortalisez votre grand jour avec des photos inoubliables ✨
                </p>
                <div className="container mx-auto">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}

export default function MariagesPage() {
    return (
        <Suspense fallback={<MariagesPageFallback />}>
            <MariagesContent />
        </Suspense>
    );
}
```

**Step 2 : Lint**

```bash
npm run lint
```

**Step 3 : Commit**

```bash
git add app/mariages/page.tsx
git commit -m "refactor(mariages): naviguer vers /mariages/[id] au clic couple, supprimer filtrage in-page"
```

---

## Test manuel

1. Aller sur `/mariages` — les cartes couples sont cliquables
2. Cliquer sur un couple **sans** mot de passe → navigation directe vers `/mariages/[id]`, photos s'affichent
3. Cliquer sur un couple **avec** mot de passe → navigation vers `/mariages/[id]`, modale apparaît
4. Saisir un mauvais mot de passe → message d'erreur rouge avec animation shake
5. Saisir le bon mot de passe → photos s'affichent avec barre de chargement
6. Bouton "Télécharger toutes les photos" fixé en bas → génère un ZIP des photos
7. Les vidéos YouTube/Dailymotion s'affichent dans la grille sans bouton télécharger
8. Lien "Mariages" dans le titre de la page detail → retour vers `/mariages`
