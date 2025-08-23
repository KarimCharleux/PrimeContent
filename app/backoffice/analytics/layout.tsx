import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Analytics - Générateur UTM | Prime Content Backoffice',
    description: 'Générez des liens UTM pour tracker vos campagnes sur les réseaux sociaux',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
