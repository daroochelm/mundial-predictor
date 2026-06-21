'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Sprawdź sesję przy ładowaniu
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkSession();

    // Nasłuchuj zmian w autoryzacji (logowanie/wylogowanie)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (pathname === '/' || pathname === '/register') return null;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold text-white tracking-wide">
            Mundial<span className="text-cyan-500">2026</span>
          </span>
        </div>

        <div className="flex space-x-6">
          <Link href="/dashboard" className={`font-medium ${pathname === '/dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}>Mecze</Link>
          <Link href="/ranking" className={`font-medium ${pathname === '/ranking' ? 'text-yellow-400' : 'text-slate-400'}`}>Ranking</Link>
        </div>

        {/* Dynamiczny przycisk */}
        {isLoggedIn ? (
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-2 border border-transparent hover:border-red-900/50 hover:bg-red-900/20 rounded-lg"
          >
            Wyloguj się
          </button>
        ) : (
          <Link 
            href="/" 
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-2 border border-cyan-900/50 bg-cyan-900/10 rounded-lg"
          >
            Zaloguj
          </Link>
        )}

      </div>
    </nav>
  );
}