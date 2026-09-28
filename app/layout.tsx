import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VI Sweets Admin',
  description: 'Secure administration panel for VI Sweets',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
