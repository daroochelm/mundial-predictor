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
  const isMatchLocked = fixture.status !== 'NS' || new Date(fixture.start_time).getTime() <= new Date().getTime();
  const pred = predictions[fixture.id] || { home: '', away: '', points: null };
  
  return (
    <div key={fixture.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Sekcja Drużyn - lewa strona */}
      <div className="flex items-center gap-3 md:gap-4 text-lg md:text-xl font-bold text-white flex-1 w-full justify-between md:justify-start">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="truncate max-w-[100px] md:max-w-[150px] text-right">{fixture.home_team}</span>
          {fixture.home_logo_url && <img src={fixture.home_logo_url} className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0" alt={fixture.home_team} />}
        </div>
  
        {/* ŚRODKOWA KOLUMNA - Wyrównana centralnie */}
        <div className="flex flex-col items-center justify-center min-w-[100px] gap-1">
          <span className="px-3 py-1 bg-slate-800 rounded-lg text-yellow-400 font-mono text-sm md:text-base">
            {fixture.status === 'NS' ? 'vs' : `${fixture.home_score} : ${fixture.away_score}`}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            fixture.status === '1H' || fixture.status === '2H' ? 'bg-green-500/20 text-green-400' :
            fixture.status === 'FT' ? 'bg-red-500/20 text-red-400' : 'text-slate-500'
          }`}>
            {fixture.status === 'NS' ? 'DO ROZPOCZĘCIA' : fixture.status}
          </span>
          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
            {new Date(fixture.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
  
        <div className="flex items-center gap-2 flex-1 justify-start">
          {fixture.away_logo_url && <img src={fixture.away_logo_url} className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0" alt={fixture.away_team} />}
          <span className="truncate max-w-[100px] md:max-w-[150px] text-left">{fixture.away_team}</span>
        </div>
      </div>
  
      {/* Sekcja Typowania - prawa strona */}
      <div className="flex items-center gap-2 mt-4 md:mt-0 flex-shrink-0 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
        <input type="number" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg" />
        <span className="text-slate-500">:</span>
        <input type="number" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg" />
        
        {fixture.status === 'FT' ? (
          <div className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm ml-2">{pred.points ?? 0} pkt</div>
        ) : (
          <button onClick={() => submitPrediction(fixture.id)} disabled={isMatchLocked} className="bg-cyan-500 px-3 py-2 rounded-lg font-bold text-sm ml-2 disabled:opacity-30">Zapisz</button>
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