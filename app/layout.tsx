import { Metadata, Viewport } from 'next';
import './globals.css';
import './styles/fonts.css';

import ClientLayout from './components/ClientLayout';

export const metadata: Metadata = {
    title: 'Primecontent | Création vidéo & photo professionnelle',
    description:
        'Créateur de contenu professionnel pour mariages, événements et entreprises basé à Paris',
    other: {
        // Empêche le pull-to-refresh sur Chrome mobile
        'format-detection': 'telephone=no',
        // Empêche la sélection et le zoom sur iOS
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
    } as Record<string, string>,
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Empêche le zoom accidentel
    viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="fr" suppressHydrationWarning={true} className="font-sora">
            <body className="font-sora">
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
