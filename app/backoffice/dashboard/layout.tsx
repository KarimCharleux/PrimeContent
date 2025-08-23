import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tableau de Bord | Backoffice',
    description: 'Tableau de bord administratif du site DaliFilms',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
