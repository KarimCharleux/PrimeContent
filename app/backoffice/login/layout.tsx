import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Connexion | Primecontent',
    description: "Page de connexion à l'interface d'administration Primecontent",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
