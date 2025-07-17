import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Événement | DaliFilms',
    description: "Informations détaillées sur l'événement | DaliFilms",
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
