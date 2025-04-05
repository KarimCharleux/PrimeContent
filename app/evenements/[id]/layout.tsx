import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Événement | Primecontent',
    description: "Informations détaillées sur l'événement | Primecontent",
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
