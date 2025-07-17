import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Accueil | DaliFilms',
    description: "Page d'accueil de l'interface d'administration DaliFilms",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
