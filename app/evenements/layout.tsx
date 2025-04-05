import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Événements | Primecontent',
    description: 'Découvrez nos événements et prestations | Primecontent',
};

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
