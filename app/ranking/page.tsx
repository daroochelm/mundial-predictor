'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ZAKTUALIZOWANY TYP: dodaliśmy username
interface RankEntry {
  user_id: string;
  user_email: string;
  username: string | null;
  total_points: number;
}

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) {
        console.error('Błąd pobierania rankingu:', error);
      } else if (data) {
        setLeaderboard(data);
      }
      setLoading(false);
    };

    fetchRanking();
    const interval = setInterval(fetchRanking, 60000);
      return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Podliczanie wyników...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-10 text-center border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Ranking Typerów 🏆
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Kto najlepiej przewiduje wyniki Mundialu?</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 md:p-6 shadow-xl">
          {leaderboard.length === 0 ? (
            <div className="text-center text-slate-500 py-10">Nikt nie zdobył jeszcze punktów. Bądź pierwszy!</div>
          ) : (
            <div className="flex flex-col gap-3">
              {leaderboard.map((player, index) => {
                const position = index + 1;
                
                // MAGIA PSEUDONIMÓW: Jeśli ma username, użyj go. Jeśli nie, utnij email.
                const displayName = player.username || (player.user_email ? player.user_email.split('@')[0] : 'Anonim');
                
                return (
                  <div 
                    key={player.user_id} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      position === 1 ? 'bg-yellow-500/10 border-yellow-500/50' :
                      position === 2 ? 'bg-slate-300/10 border-slate-400/30' :
                      position === 3 ? 'bg-amber-700/10 border-amber-700/30' :
                      'bg-slate-950 border-slate-800'
                    } transition-all hover:bg-slate-800`}
                  >
                    <div className="flex items-center gap-4">
                      
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${
                        position === 1 ? 'bg-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                        position === 2 ? 'bg-slate-300 text-slate-900 shadow-[0_0_15px_rgba(203,213,225,0.3)]' :
                        position === 3 ? 'bg-amber-600 text-slate-900 shadow-[0_0_15px_rgba(217,119,6,0.3)]' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                      </div>
                      
                      <div className="font-medium text-slate-200 text-lg tracking-wide">
                        {displayName}
                        {/* Dodajemy mały znacznik dla osób bez nicku */}
                        {!player.username && <span className="ml-2 text-xs text-slate-500 font-normal">(Nowy Gracz)</span>}
                      </div>
                    </div>

                    <div className="text-3xl font-black text-cyan-400">
                      {player.total_points} <span className="text-sm font-medium text-slate-500">pkt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}