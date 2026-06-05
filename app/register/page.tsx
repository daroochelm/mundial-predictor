'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Rejestracja w Supabase Auth z dodatkowymi metadanymi (username)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // To zostanie przechwycone przez nasz SQL Trigger!
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      alert('Rejestracja pomyślna! Sprawdź skrzynkę e-mail, aby potwierdzić konto.');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Dołącz do Typerów</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Mistrzostwa Świata 2026 czekają</p>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Nazwa użytkownika (Login)</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="np. kibic123" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Adres Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="email@przyklad.pl" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Hasło</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-slate-950">
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>
      </div>
    </div>
  );
}