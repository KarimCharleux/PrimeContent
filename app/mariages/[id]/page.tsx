import { Suspense } from 'react';

import Footer from '../../components/Footer';
import Header from '../../components/Header';

import MariageDetailClient from './MariageDetailClient';

export default async function MariageDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <main className="global-main-page">
            <Header />
            <Suspense
                fallback={
                    <div className="photos-loader">
                        <div className="loader-spinner" />
                    </div>
                }
            >
                <MariageDetailClient coupleId={id} />
            </Suspense>
            <Footer />
        </main>
    );
}
