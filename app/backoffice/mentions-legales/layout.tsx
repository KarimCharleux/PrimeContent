import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin - Mentions Légales | Dalifilms',
    description: 'Administration des mentions légales',
};

export default function MentionsLegalesAdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
