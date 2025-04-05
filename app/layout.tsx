import { Metadata } from 'next';
import './globals.css';
import './styles/fonts.css';

import ClientLayout from './components/ClientLayout';

export const metadata: Metadata = {
    title: 'Primecontent | Création vidéo & photo professionnelle',
    description:
        'Créateur de contenu professionnel pour mariages, événements et entreprises basé à Paris',
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
