import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mentions Légales | Prime Content',
    description: 'Mentions légales de Prime Content - Informations juridiques obligatoires.',
};

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
