import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mentions Légales | Dalifilms',
    description: 'Mentions légales de Dalifilms - Informations juridiques obligatoires.',
};

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
