import { Metadata } from 'next';
import './globals.css';
import './styles/fonts.css';

import ClientLayout from './components/ClientLayout';

export const metadata: Metadata = {
    title: 'Primecontent | Création vidéo & photo professionnelle',
    description:
        'Créateur de contenu professionnel pour mariages, événements et entreprises basé à Paris',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false, // Empêche le zoom accidentel
        viewportFit: 'cover',
    },
    other: {
        // Empêche le pull-to-refresh sur Chrome mobile
        'format-detection': 'telephone=no',
        // Empêche la sélection et le zoom sur iOS
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
        'apple-touch-fullscreen': 'yes',
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="fr"
            suppressHydrationWarning={true}
            className="font-sora"
            style={{
                overscrollBehavior: 'none',
                touchAction: 'manipulation',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            <body
                className="font-sora"
                style={{
                    overscrollBehavior: 'none',
                    overflowX: 'hidden',
                    touchAction: 'manipulation',
                }}
            >
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
