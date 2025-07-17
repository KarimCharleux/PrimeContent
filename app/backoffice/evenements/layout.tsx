import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Événements | DaliFilms',
    description: "Interface d'administration pour la gestion des événements",
};

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
