import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PrimeContent',
    description: 'PrimeContent',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-oid="b5x4lok" suppressHydrationWarning={true}>
            <body className={inter.className} data-oid="sgp8axh">
                {children}
            </body>
        </html>
    );
}
