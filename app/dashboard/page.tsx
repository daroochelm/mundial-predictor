'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import WorldCupCountdown from '@/components/Countdown';
import MatchCard from '@/components/MatchCard';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Generujemy datę 'dzisiaj', ale w strefie UTC
    return new Date().toISOString().split('T')[0];
  });
  const [selectedStage, setSelectedStage] = useState('knockout');

  const renderEventIcon = (type: string, detail: string) => {
    // Jeśli to niewykorzystany rzut karny, zwróć inną ikonę lub nic
    if (detail === 'Missed Penalty') return <span className="text-red-500">❌</span>;
    // 2. Samobój: Czerwona piłka
  if (detail==='Own Goal') {
    return <span className="text-red-600 font-bold">⚽</span>;
  }
    if (type === 'Goal') return <span>⚽</span>;
    if (type === 'Card') return <span className={`w-2 h-4 rounded-sm inline-block ${detail === 'Yellow Card' ? 'bg-yellow-400' : 'bg-red-600'}`}></span>;
    if (type === 'subst') return <span className="text-green-500 font-bold">⇅</span>;
    
    return null;
  }; 

  const availableDates = useMemo(() => {
    // Pobieramy tylko mecze z fazy pucharowej
    const knockoutFixtures = fixtures.filter(f => f.stage_type === 'knockout');
    
    // Wyciągamy daty tylko dla tych meczów
    const dates = new Set(knockoutFixtures.map(f => f.start_time.substring(0, 10)));
    
    // Opcjonalnie: jeśli dzisiaj jest dzień pucharowy, dodaj go
    const today = new Date().toISOString().split('T')[0];
    if (knockoutFixtures.some(f => f.start_time.substring(0, 10) === today)) {
      dates.add(today);
    }
    
    return Array.from(dates).sort();
  }, [fixtures]);

  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      const matchDate = new Date(f.start_time).toISOString().split('T')[0];
      const isFromSelectedDay = matchDate === selectedDate;
      
      // Jeśli chcesz, aby mecz był widoczny TYLKO w swoim dniu:
      return isFromSelectedDay;
    });
  }, [fixtures, selectedDate]);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsInitialLoading(true);
    const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    const { data: fixturesData } = await supabase
    .from('fixtures')
    .select('*')
    .eq('league_id', 1)
    .order('start_time', { ascending: true });

    if (fixturesData) {
      setFixtures(fixturesData);
      const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .in('fixture_id', fixturesData.map(f => f.id));
      console.log("Pobrane zdarzenia:", eventsData);
      setEvents(eventsData || []);

      if (session?.user) {
        const { data: predictionsData } = await supabase.from('predictions').select('match_id, home_score_guess, away_score_guess, points_earned').eq('user_id', session.user.id);
        if (predictionsData) {
          const predsObj: Record<number, any> = {};
          predictionsData.forEach(p => predsObj[p.match_id] = { home: p.home_score_guess, away: p.away_score_guess, points: p.points_earned });
          setPredictions(predsObj);
        }
      }
    }
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const submitPrediction = async (fixtureId: number) => {
    if (!user) return;
    const pred = predictions[fixtureId];
    if (!pred || pred.home === '' || pred.away === '') return;
    await supabase.from('predictions').upsert({ user_id: user.id, match_id: fixtureId, home_score_guess: pred.home, away_score_guess: pred.away }, { onConflict: 'user_id, match_id' });
    setMessages(prev => ({ ...prev, [fixtureId]: 'Zapisano!' }));
    setTimeout(() => setMessages(prev => ({ ...prev, [fixtureId]: '' })), 2000);
  };

  if (isInitialLoading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Ładowanie...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center py-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-cyan-500">
    1/16 Finału
  </h2>
  <p className="text-red-500 font-semibold text-sm mt-1">
    Typuj wyniki regulaminowe (90 minut)
  </p>
</div>
        
        <div className="flex overflow-x-auto gap-2 pb-4 mt-6">
          {availableDates.map(date => (
            <button key={date} onClick={() => setSelectedDate(date)} className={`px-4 py-2 rounded-full text-sm ${selectedDate === date ? 'bg-cyan-600' : 'bg-slate-800'}`}>
              {new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </button>
          ))}
        </div>

        <div className="grid gap-6 mt-4">
          {filteredFixtures.map((fixture) => {
            const pred = predictions[fixture.id] || { home: '', away: '', points: null };
            const isMatchLocked = fixture.status !== 'NS';
            
            return (
              <div key={fixture.id} className="mb-12">
                <MatchCard 
                  homeTeam={fixture.home_team} awayTeam={fixture.away_team}
                  homeScore={fixture.home_score} awayScore={fixture.away_score}
                  status={fixture.status} minute={fixture.minute ?? 0}
                  homeLogo={fixture.home_logo_url} awayLogo={fixture.away_logo_url}
                  startTime={fixture.start_time} halftimeScore={fixture.halftime_score}
                />
                
                <div className="flex items-center justify-center gap-4 mt-4 mb-2">
                  {user ? (
                    <>
                      <input type="number" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => setPredictions(p => ({...p, [fixture.id]: {...p[fixture.id], home: e.target.value}}))} onBlur={() => submitPrediction(fixture.id)} className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" />
                      <input type="number" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => setPredictions(p => ({...p, [fixture.id]: {...p[fixture.id], away: e.target.value}}))} onBlur={() => submitPrediction(fixture.id)} className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" />
                    </>
                  ) : (
                    <div className="text-slate-600 text-xs italic">Zaloguj się, aby typować wyniki</div>
                  )}
                  
                  {fixture.status === 'FT' && pred.points !== null && (
                    <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full text-xs">
                      +{pred.points} pkt
                    </span>
                  )}
                </div>

               
                {messages[fixture.id] && <p className="text-center text-xs text-green-400">{messages[fixture.id]}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}