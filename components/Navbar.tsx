'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Przekierowanie na stronę logowania
  };

  // Nie pokazuj paska nawigacji na stronie logowania/rejestracji
  if (pathname === '/' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo / Tytuł */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold text-white tracking-wide">
            Mundial<span className="text-cyan-500">2026</span>
          </span>
        </div>

        {/* Linki nawigacyjne */}
        <div className="flex space-x-6">
          <Link 
            href="/dashboard" 
            className={`font-medium transition-colors ${
              pathname === '/dashboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mecze
          </Link>
          <Link 
            href="/ranking" 
            className={`font-medium transition-colors ${
              pathname === '/ranking' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ranking
          </Link>
         
        </div>

        {/* Przycisk wylogowania */}
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-2 border border-transparent hover:border-red-900/50 hover:bg-red-900/20 rounded-lg"
        >
          Wyloguj się
        </button>

      </div>
    </nav>
  );
}