import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tableau de Bord | Primecontent',
    description: 'Tableau de bord administratif du site Primecontent',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
