import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Pradar AI (Demo)',
    description: 'Minimal agent demo for Pradar AI',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
