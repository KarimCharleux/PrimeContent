import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Profil Utilisateur | DaliFilms',
    description: "Gestion du profil utilisateur dans l'administration DaliFilms",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
