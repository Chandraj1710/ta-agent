import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
