import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Réseaux Sociaux | Backoffice Primecontent',
    description: "Interface d'administration pour gérer le contenu de la page réseaux sociaux",
};

export default function ReseauxSociauxBackofficeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
