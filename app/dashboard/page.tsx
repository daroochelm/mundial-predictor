'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, { home: number | string; away: number | string; points?: number | null }>>({});
  const [messages, setMessages] = useState<Record<number, string>>({}); // Stan dla komunikatów
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Funkcja pomocnicza dla statusów
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NS': return 'Nie rozpoczęty';
      case '1H': return '1. połowa';
      case 'HT': return 'Przerwa';
      case '2H': return '2. połowa';
      case 'FT': return 'Koniec';
      case 'ET': return 'Dogrywka';
      case 'PST': return 'Przełożony';
      case 'CANC': return 'Odwołany';
      default: return status;
    }
  };

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
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lte('start_time', `${selectedDate}T23:59:59`)
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
  }, [router, selectedDate]);

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
    if (pred.home === '' || pred.away === '') return;

    const { data: existing } = await supabase.from('predictions').select('id').eq('user_id', user.id).eq('match_id', fixtureId).maybeSingle();
    
    if (existing) {
      await supabase.from('predictions').update({ home_score_guess: pred.home, away_score_guess: pred.away }).eq('id', existing.id);
    } else {
      await supabase.from('predictions').insert({ user_id: user.id, match_id: fixtureId, home_score_guess: pred.home, away_score_guess: pred.away });
    }

    setMessages((prev) => ({ ...prev, [fixtureId]: 'Zapisano!' }));
    setTimeout(() => setMessages((prev) => ({ ...prev, [fixtureId]: '' })), 3000);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Ładowanie...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Mecze i Typy</h1>
        
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-800 text-white p-3 rounded-xl mb-6 w-full border border-slate-700"
        />

        <div className="grid gap-4">
          {fixtures.length === 0 ? (
            <p className="text-slate-500 text-center">Brak meczów w wybranym dniu.</p>
          ) : (
            fixtures.map((fixture) => {
              const isMatchLocked = fixture.status !== 'NS' || new Date(fixture.start_time).getTime() <= new Date().getTime();
              const pred = predictions[fixture.id] || { home: '', away: '', points: null };
              
              return (
                <div key={fixture.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-4">
                  <div className="text-[10px] text-slate-500 font-medium">
                    {new Date(fixture.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center justify-between w-full gap-2 min-w-0">
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className="truncate text-xs md:text-sm font-bold text-white block">{fixture.home_team}</span>
                      {fixture.home_logo_url && <img src={fixture.home_logo_url} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                      <div className="px-3 py-1 bg-slate-800 rounded-lg text-yellow-400 font-mono text-sm font-bold whitespace-nowrap">
                        {fixture.status === 'NS' ? 'vs' : `${fixture.home_score} : ${fixture.away_score}`}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                         {['1H', '2H', 'HT'].includes(fixture.status) && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                         {getStatusLabel(fixture.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                      {fixture.away_logo_url && <img src={fixture.away_logo_url} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />}
                      <span className="truncate text-xs md:text-sm font-bold text-white block">{fixture.away_team}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center w-full border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-center gap-3">
                      <input type="number" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg border border-slate-700" />
                      <span className="text-slate-500">:</span>
                      <input type="number" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} className="w-12 h-10 bg-slate-800 text-center text-white rounded-lg border border-slate-700" />
                      
                      {fixture.status === 'FT' ? (
                        <div className="ml-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">{pred.points ?? 0} pkt</div>
                      ) : (
                        <button onClick={() => submitPrediction(fixture.id)} disabled={isMatchLocked} className="ml-2 bg-cyan-500 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30">Zapisz</button>
                      )}
                    </div>
                    {/* Komunikat "Zapisano" */}
                    {messages[fixture.id] && (
                      <div className="mt-2 text-green-400 text-xs font-bold">{messages[fixture.id]}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}