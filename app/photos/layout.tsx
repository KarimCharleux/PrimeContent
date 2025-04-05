import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfolio Photos | Primecontent',
    description: 'Découvrez notre portfolio de photos professionnelles | Primecontent',
};

export default function PhotosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
