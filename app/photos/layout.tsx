import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfolio Photos | DaliFilms',
    description: 'Découvrez notre portfolio de photos professionnelles | DaliFilms',
};

export default function PhotosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
