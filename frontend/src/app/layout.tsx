import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ChatWrapper } from '@/components/chat/ChatWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FGE Cotizador',
  description: 'Plataforma para planificación y cotización de proyectos de construcción',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <ChatWrapper />
      </body>
    </html>
  );
}
