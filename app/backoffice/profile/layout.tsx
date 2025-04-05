import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Profil Utilisateur | Primecontent',
    description: "Gestion du profil utilisateur dans l'administration Primecontent",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
