import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mariages | Primecontent',
    description: 'Services vidéo et photo pour votre mariage | Primecontent',
};

export default function MariagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
