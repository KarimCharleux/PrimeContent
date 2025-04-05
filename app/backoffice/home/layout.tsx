import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Accueil | Primecontent',
    description: "Page d'accueil de l'interface d'administration Primecontent",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
