import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TA Ops Agent - Talent Acquisition',
  description: 'Pipeline alerts, scorecard accountability, and referral follow-up',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans', inter.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
