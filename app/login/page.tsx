'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else {
      router.push('/dashboard'); // Przekierowanie do panelu z meczami
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Zaloguj się</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Wróć do gry i typuj wyniki live</p>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Adres Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="email@przyklad.pl" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Hasło</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-slate-950">
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          Nie masz konta? <a href="/register" className="text-cyan-400 hover:underline">Zarejestruj się</a>
        </p>
      </div>
    </div>
  );
}