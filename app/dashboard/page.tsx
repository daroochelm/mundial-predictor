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
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-10">Mecze i Typy</h1>
        <div className="grid gap-6">
          {fixtures.map((fixture) => {
            // Podwójna blokada: status musi być 'NS' ORAZ mecz musi być w przyszłości
            const isMatchLocked = 
              fixture.status !== 'NS' || 
              new Date(fixture.start_time).getTime() <= new Date().getTime();
            
            const pred = predictions[fixture.id] || { home: '', away: '', points: null };
            
            return (
              <div key={fixture.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-4 text-xl font-bold text-white">
                  {fixture.home_logo_url && <img src={fixture.home_logo_url} className="w-8 h-8 rounded-full bg-slate-800" alt={fixture.home_team} />}
                  <span className="w-24 text-right truncate">{fixture.home_team}</span>
                  
                  <div className="flex flex-col items-center">
                    <span className="px-4 py-2 bg-slate-800 rounded-lg text-yellow-400 font-mono">
                      {fixture.status === 'NS' ? 'vs' : `${fixture.home_score} : ${fixture.away_score}`}
                    </span>
                    
                    <span className={`text-[10px] mt-1 font-bold px-2 py-0.5 rounded ${
                      fixture.status === '1H' || fixture.status === '2H' ? 'bg-green-500/20 text-green-400' :
                      fixture.status === 'FT' ? 'bg-red-500/20 text-red-400' :
                      fixture.status === 'CANC' ? 'bg-gray-500/20 text-gray-400' :
                      fixture.status === 'PST' ? 'bg-orange-500/20 text-orange-400' :
                      fixture.status === 'PEN' ? 'bg-purple-500/20 text-purple-400' :
                      'text-slate-500'
                    }`}>
                      {fixture.status === 'NS' ? 'DO ROZPOCZĘCIA' : fixture.status}
                    </span>

                    <span className="text-xs text-slate-500 mt-1 font-medium">
                      {new Date(fixture.start_time).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <span className="w-24 text-left truncate">{fixture.away_team}</span>
                  {fixture.away_logo_url && <img src={fixture.away_logo_url} className="w-8 h-8 rounded-full bg-slate-800" alt={fixture.away_team} />}
                </div>

                <div className="flex items-center gap-3">
                  <input type="number" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} className="w-14 h-12 bg-slate-800 text-center text-white rounded-lg disabled:opacity-30" />
                  <span className="text-slate-500">:</span>
                  <input type="number" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} className="w-14 h-12 bg-slate-800 text-center text-white rounded-lg disabled:opacity-30" />
                  
                  {fixture.status === 'FT' ? (
                    <div className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold">{pred.points ?? 0} pkt</div>
                  ) : (
                    <button onClick={() => submitPrediction(fixture.id)} disabled={isMatchLocked} className="bg-cyan-500 px-4 py-2 rounded-lg font-bold disabled:opacity-30">Zapisz</button>
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