import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfolio Vidéos | Primecontent',
    description: 'Découvrez notre portfolio de vidéos professionnelles | Primecontent',
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
