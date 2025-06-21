import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Conception Interfaces Mobile/Web | Primecontent',
    description:
        "Nous créons des interfaces utilisateur modernes et intuitives pour vos applications mobiles et web, en mettant l'accent sur l'expérience utilisateur et le design responsive.",
    keywords:
        'conception interface, UI/UX, design mobile, design web, application, interface utilisateur',
    openGraph: {
        title: 'Conception Interfaces Mobile/Web | Primecontent',
        description:
            'Nous créons des interfaces utilisateur modernes et intuitives pour vos applications mobiles et web.',
        type: 'website',
    },
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return children;
}
