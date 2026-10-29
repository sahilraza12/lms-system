import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VIQ Technologies | Learning & Institutional ERP',
  description:
    'VIQ Technologies learning and institutional ERP platform for students, teachers, centers, and administrators.',
  icons: {
    icon: [
      {
        url: '/logonavbar1-CCdzKR7I.png',
        type: 'image/png',
      },
    ],
    shortcut: '/logonavbar1-CCdzKR7I.png',
    apple: '/logonavbar1-CCdzKR7I.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth`}
    >
      <body className="bg-black text-white antialiased selection:bg-orange-500 selection:text-white min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}