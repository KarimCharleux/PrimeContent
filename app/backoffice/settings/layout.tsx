import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Paramètres | Backoffice',
    description: "Interface d'administration pour les paramètres du site",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
