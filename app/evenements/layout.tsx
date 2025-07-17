import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Événements | DaliFilms',
    description: 'Découvrez nos événements et prestations | DaliFilms',
};

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
