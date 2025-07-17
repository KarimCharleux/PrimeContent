import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Conception Web - Backoffice | DaliFilms',
    description: 'Gestion du contenu de la page conception interfaces mobile/web',
};

export default function WebBackofficeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
