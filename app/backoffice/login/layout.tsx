import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Connexion | DaliFilms',
    description: "Page de connexion à l'interface d'administration DaliFilms",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
