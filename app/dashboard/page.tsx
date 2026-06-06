'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, { home: number | string; away: number | string; points?: number | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: fixturesData } = await supabase
  .from('fixtures')
  .select('*')
  .gte('start_time', '2026-01-01')
  .order('start_time', { ascending: true });

      if (fixturesData) setFixtures(fixturesData);

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('match_id, home_score_guess, away_score_guess, points_earned')
        .eq('user_id', session.user.id);

      if (predictionsData) {
        const predsObj: Record<number, any> = {};
        predictionsData.forEach((p) => {
          predsObj[p.match_id] = { home: p.home_score_guess, away: p.away_score_guess, points: p.points_earned };
        });
        setPredictions(predsObj);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handlePredictionChange = (fixtureId: number, team: 'home' | 'away', value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    setPredictions((prev) => ({
      ...prev,
      [fixtureId]: { ...(prev[fixtureId] || { home: '', away: '', points: null }), [team]: numValue },
    }));
  };

  const submitPrediction = async (fixtureId: number) => {
    if (!user) return;
    const pred = predictions[fixtureId];
    if (pred.home === '' || pred.away === '') { alert('Wpisz wynik!'); return; }

    const { data: existing } = await supabase.from('predictions').select('id').eq('user_id', user.id).eq('match_id', fixtureId).maybeSingle();
    if (existing) {
      await supabase.from('predictions').update({ home_score_guess: pred.home, away_score_guess: pred.away }).eq('id', existing.id);
    } else {
      await supabase.from('predictions').insert({ user_id: user.id, match_id: fixtureId, home_score_guess: pred.home, away_score_guess: pred.away });
    }
    alert('Zapisano!');
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Ładowanie...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Mecze i Typy</h1>
        <div className="grid gap-4">
          {fixtures.map((fixture) => {
            console.log("Mecz:", fixture);
            const isMatchLocked = fixture.status !== 'NS' || new Date(fixture.start_time).getTime() <= new Date().getTime();
            const pred = predictions[fixture.id] || { home: '', away: '', points: null };
            
            return (
              <div key={fixture.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-4">
                {/* Data i Status */}
                <div className="text-[10px] text-slate-500 font-medium">
                  {new Date(fixture.start_time).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} | 
                  {new Date(fixture.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Drużyny i Wynik */}
                <div className="flex items-center justify-between w-full gap-2 min-w-0"> {/* Dodane min-w-0 */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0"> {/* Dodane min-w-0 */}
                  <span className="truncate text-xs md:text-sm font-bold text-white block">{fixture.home_team}</span>
                    {fixture.home_logo_url && <img src={fixture.home_logo_url} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />}
                  </div>
                  
                  <div className="px-3 py-1 bg-slate-800 rounded-lg text-yellow-400 font-mono text-sm font-bold whitespace-nowrap">
                    {fixture.status === 'NS' ? 'vs' : `${fixture.home_score} : ${fixture.away_score}`}
                  </div>

                                  <div className="flex items-center gap-2 flex-1 justify-start min-w-0"> {/* Dodane min-w-0 */}
                    {fixture.away_logo_url && <img src={fixture.away_logo_url} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />}
                    <span className="truncate text-xs md:text-sm font-bold text-white block">{fixture.away_team}</span>
                  </div>
                </div>
                

                {/* Typowanie */}
                <div className="flex items-center justify-center gap-3 w-full border-t border-slate-800 pt-3">
                  <input type="number" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg border border-slate-700" />
                  <span className="text-slate-500">:</span>
                  <input type="number" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg border border-slate-700" />
                  
                  {fixture.status === 'FT' ? (
                    <div className="ml-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">{pred.points ?? 0} pkt</div>
                  ) : (
                    <button onClick={() => submitPrediction(fixture.id)} disabled={isMatchLocked} className="ml-2 bg-cyan-500 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30">Zapisz</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}