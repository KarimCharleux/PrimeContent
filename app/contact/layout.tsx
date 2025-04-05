import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact | Primecontent',
    description: 'Contactez-nous pour vos projets vidéo et photo | Primecontent',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
