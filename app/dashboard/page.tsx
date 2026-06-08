'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import WorldCupCountdown from '@/components/Countdown'; // Zakładając, że stworzyłeś ten plik

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { 'NS': 'Nie rozpoczęty', '1H': '1. połowa', 'HT': 'Przerwa', '2H': '2. połowa', 'FT': 'Koniec', 'ET': 'Dogrywka' };
    return labels[status] || status;
  };

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsInitialLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    setUser(session.user);

    const { data: fixturesData } = await supabase
      .from('fixtures')
      .select('*')
      .in('league_id', [10, 340, 99])
      .gte('start_time', `${selectedDate}T00:00:00`)
      .lte('start_time', `${selectedDate}T23:59:59`)
      .order('start_time', { ascending: true });

    if (fixturesData) {
      setFixtures(fixturesData);
      
      // Optymalizacja: pobieramy typy tylko dla tych konkretnych meczów
      const matchIds = fixturesData.map(f => f.id);
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('match_id, home_score_guess, away_score_guess, points_earned')
        .eq('user_id', session.user.id)
        .in('match_id', matchIds);

      if (predictionsData) {
        const predsObj: Record<number, any> = {};
        predictionsData.forEach(p => predsObj[p.match_id] = { home: p.home_score_guess, away: p.away_score_guess, points: p.points_earned });
        setPredictions(predsObj);
      }
    }
    setIsInitialLoading(false);
  }, [router, selectedDate]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePredictionChange = (fixtureId: number, team: 'home' | 'away', value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    
    if (typeof numValue === 'number' && numValue < 0) return;
  
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: { 
        ...(prev[fixtureId] || { home: '', away: '' }), 
        [team]: numValue 
      },
    }));
  };

  const submitPrediction = async (fixtureId: number) => {
    if (!user) return;
    const pred = predictions[fixtureId] || { home: '', away: '' };
   // Dodatkowe zabezpieczenie: jeśli oba pola są puste, nie wysyłaj zapytania
  if (pred.home === '' || pred.home === undefined || pred.away === '' || pred.away === undefined) {
    return;
  }

  const { data: existing } = await supabase.from('predictions').select('id').eq('user_id', user.id).eq('match_id', fixtureId).maybeSingle();
    
    if (existing) {
      await supabase.from('predictions').update({ home_score_guess: pred.home, away_score_guess: pred.away }).eq('id', existing.id);
    } else {
      await supabase.from('predictions').insert({ user_id: user.id, match_id: fixtureId, home_score_guess: pred.home, away_score_guess: pred.away });
    }

    setMessages(prev => ({ ...prev, [fixtureId]: 'Zapisano!' }));
    setTimeout(() => setMessages(prev => ({ ...prev, [fixtureId]: '' })), 2000);
  };

  if (isInitialLoading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Ładowanie danych...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center mb-4 uppercase">Typer 2026</h1>
        <WorldCupCountdown />
        
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-900 w-full p-4 rounded-xl border border-slate-700 mt-6 mb-8"
        />

        <div className="grid gap-4">
          {fixtures.map((fixture) => {
            const isMatchLocked = fixture.status !== 'NS' || new Date(fixture.start_time).getTime() <= new Date().getTime();
            const pred = predictions[fixture.id] || { home: '', away: '', points: null };
            
            return (
              <div key={fixture.id} className="bg-slate-900 border border-slate-700 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400">{new Date(fixture.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded">{getStatusLabel(fixture.status)}</span>
                </div>

                <div className="flex justify-between items-center gap-4 text-center">
  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
    {fixture.home_logo_url && <img src={fixture.home_logo_url} className="w-10 h-10 rounded-full" alt="" />}
    <span className="font-bold truncate text-sm">{fixture.home_team}</span>
  </div>
  
  <div className="font-mono text-xl">
    {fixture.status === 'NS' ? 'VS' : `${fixture.home_score}:${fixture.away_score}`}
  </div>

  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
    {fixture.away_logo_url && <img src={fixture.away_logo_url} className="w-10 h-10 rounded-full" alt="" />}
    <span className="font-bold truncate text-sm">{fixture.away_team}</span>
  </div>
</div>

                <div className="flex items-center justify-center gap-4 mt-6">
                <input 
  type="number" 
  min="0" 
  disabled={isMatchLocked} 
  value={pred.home ?? ''} 
  onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} 
  onBlur={() => !isMatchLocked && submitPrediction(fixture.id)} 
  className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" 
/>
{/* To samo dla away */}
<input 
  type="number" 
  min="0" 
  disabled={isMatchLocked} 
  value={pred.away ?? ''} 
  onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} 
  onBlur={() => !isMatchLocked && submitPrediction(fixture.id)} 
  className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" 
/>
                  
                  {fixture.status === 'FT' && <span className="ml-4 text-green-400 font-bold">{pred.points ?? 0} pkt</span>}
                </div>
                {messages[fixture.id] && <p className="text-center text-xs text-green-400 mt-2">{messages[fixture.id]}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}