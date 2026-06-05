import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar'; // <--- DODANY IMPORT

export const metadata: Metadata = {
  title: 'Typer Mundial 2026',
  description: 'Typuj mecze i wygrywaj!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col">
        {/* DODANY NAVBAR NA SAMEJ GÓRZE */}
        <Navbar />
        
        {/* GŁÓWNA ZAWARTOŚĆ STRONY */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}