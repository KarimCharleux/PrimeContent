import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfolio Vidéos | DaliFilms',
    description: 'Découvrez notre portfolio de vidéos professionnelles | DaliFilms',
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
