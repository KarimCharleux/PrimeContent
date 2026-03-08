'use client';

import { saveAs } from 'file-saver';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    if (
        ['portrait', 'vertical', 'vert', 'tall', 'standing', 'debout'].some((k) => name.includes(k))
    )
        return 'portrait';
    if (
        ['paysage', 'landscape', 'horizontal', 'horiz', 'wide', 'large'].some((k) =>
            name.includes(k),
        )
    )
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
                    .map((d) => ({ id: d.id, ...d.data() }) as CoupleMedia)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                // 2. Charger les vidéos externes (YouTube/Dailymotion)
                const videosSnap = await getDocs(
                    query(collection(db, 'coupleVideos'), where('coupleId', '==', couple.id)),
                );
                const coupleVideos = videosSnap.docs.map(
                    (d) => ({ id: d.id, ...d.data() }) as CoupleVideo,
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
