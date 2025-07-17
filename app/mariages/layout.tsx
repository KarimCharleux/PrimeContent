import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mariages | DaliFilms',
    description: 'Services vidéo et photo pour votre mariage | DaliFilms',
};

export default function MariagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
