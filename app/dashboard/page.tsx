'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import WorldCupCountdown from '@/components/Countdown';
import { Goal, CreditCard, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]); // Stan dla zdarzeń
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const renderEventIcon = (type: string, detail: string) => {
    if (type === 'Goal') {
      return <span className="text-sm">⚽</span>;
    }
    if (type === 'Card') {
      return (
        <span className={`w-3 h-4 rounded-sm ${detail === 'Yellow Card' ? 'bg-yellow-400' : 'bg-red-600'}`}></span>
      );
    }
    return null;
  };
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today < '2026-06-11') return '2026-06-11';
    if (today > '2026-06-27') return '2026-06-27';
    return today;
  });

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(fixtures.map(f => f.start_time.split('T')[0]))).sort();
    return dates;
  }, [fixtures]);

  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => f.start_time.startsWith(selectedDate));
  }, [fixtures, selectedDate]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { 'NS': 'Nie rozpoczęty', '1H': '1. połowa', 'HT': 'Przerwa', '2H': '2. połowa', 'FT': 'Koniec', 'ET': 'Dogrywka', 'P': 'Karne', 'AET': 'Dogrywka' };
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
      .eq('league_id', 1) 
      .order('start_time', { ascending: true });

    if (fixturesData) {
      setFixtures(fixturesData);
      const matchIds = fixturesData.map(f => f.id);
      
      // Pobieranie eventów
      const { data: eventsData } = await supabase
  .from('events')
  .select('*')
  .in('fixture_id', matchIds);

setEvents(eventsData || []);

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
  }, [router]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePredictionChange = (fixtureId: number, team: 'home' | 'away', value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    if (typeof numValue === 'number' && numValue < 0) return;
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: { ...(prev[fixtureId] || { home: '', away: '' }), [team]: numValue },
    }));
  };

  const submitPrediction = async (fixtureId: number) => {
    if (!user) return;
    const pred = predictions[fixtureId] || { home: '', away: '' };
    if (pred.home === '' || pred.home === undefined || pred.away === '' || pred.away === undefined) return;

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
        
        <div className="flex overflow-x-auto gap-2 pb-4 mt-6 scrollbar-hide">
          {availableDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${selectedDate === date ? 'bg-cyan-600' : 'bg-slate-800'}`}
            >
              {new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </button>
          ))}
        </div>

        <div className="grid gap-4 mt-4">
          {filteredFixtures.map((fixture) => {
            const isMatchLocked = fixture.status !== 'NS' || new Date(fixture.start_time).getTime() <= new Date().getTime();
            const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(fixture.status);
            const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.status);
            const pred = predictions[fixture.id] || { home: '', away: '', points: null };
            
            // Sortowanie zdarzeń od najnowszego (b.minute - a.minute)
            const matchEvents = events
  .filter(e => Number(e.fixture_id) === Number(fixture.id))
  .filter(e => !['subst', 'Var'].includes(e.event_type)) // Dodajemy 'Var' do listy ignorowanych
  .sort((a, b) => b.minute - a.minute);
                          
            return (
              <div key={fixture.id} className="bg-slate-900 border border-slate-700 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400">{new Date(fixture.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${isLive ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                      {isLive ? 'LIVE' : getStatusLabel(fixture.status)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 text-center">
                  <div className="flex flex-col items-center gap-2 flex-1"><img src={fixture.home_logo_url} className="w-10 h-10 rounded-full" alt="home" /><span className="text-sm truncate font-bold">{fixture.home_team}</span></div>
                  <div className={`font-mono text-xl ${isLive ? 'text-red-500 font-bold' : 'text-white'}`}>
                      {fixture.status === 'NS' 
                        ? 'VS' 
                        : (
                          <div className="flex flex-col items-center">
                            <span>{fixture.home_score}:{fixture.away_score}</span>
                            {fixture.halftime_score && (
                              <span className="text-[10px] text-slate-500">(HT: {fixture.halftime_score})</span>
                            )}
                          </div>
                        )
                      }
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1"><img src={fixture.away_logo_url} className="w-10 h-10 rounded-full" alt="away" /><span className="text-sm truncate font-bold">{fixture.away_team}</span></div>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <input type="number" min="0" disabled={isMatchLocked} value={pred.home ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'home', e.target.value)} onBlur={() => !isMatchLocked && submitPrediction(fixture.id)} className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" />
                  <input type="number" min="0" disabled={isMatchLocked} value={pred.away ?? ''} onChange={(e) => handlePredictionChange(fixture.id, 'away', e.target.value)} onBlur={() => !isMatchLocked && submitPrediction(fixture.id)} className="w-16 h-12 bg-slate-950 text-center rounded-lg border border-slate-700" />
                  {fixture.status === 'FT' && <span className="ml-4 text-green-400 font-bold">{pred.points ?? 0} pkt</span>}
                </div>
                {messages[fixture.id] && <p className="text-center text-xs text-green-400 mt-2">{messages[fixture.id]}</p>}

                {/* Sekcja Zdarzeń */}
                {isFinished ? (
                  <details className="group mt-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <summary className="cursor-pointer list-none p-3 text-xs text-slate-400 flex justify-between items-center group-open:text-cyan-400">
                      <span>Zdarzenia meczowe</span>
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 border-t border-slate-800 space-y-2">
                    {matchEvents.map((ev, idx) => {
  const isHome = ev.team_name === fixture.home_team;
  
  return (
    <div key={idx} className="flex items-center text-sm my-2">
      {/* Kolumna gospodarza (lewa) - zawsze zajmuje 50% */}
      <div className="flex-1 flex items-center justify-start gap-2">
        {isHome && (
          <>
            <span className="text-cyan-500 font-bold w-8">{ev.minute}'</span>
            <span className="text-slate-200">{ev.player_name}</span>
            {renderEventIcon(ev.event_type, ev.extra_info)}
          </>
        )}
      </div>

      {/* Kolumna gościa (prawa) - zawsze zajmuje 50% */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {!isHome && (
          <>
            {renderEventIcon(ev.event_type, ev.extra_info)}
            <span className="text-slate-200">{ev.player_name}</span>
            <span className="text-cyan-500 font-bold w-8">{ev.minute}'</span>
          </>
        )}
      </div>
    </div>
  );
})} 
                    </div>
                  </details>
                ) : isLive ? (
                  <div className="mt-4 p-4 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-2">
                    <p className="text-red-500 font-bold text-xs uppercase mb-2">Aktualne zdarzenia:</p>
                    {matchEvents.map((ev, idx) => {
  const isHome = ev.team_name === fixture.home_team;
  
  return (
    <div key={idx} className="flex items-center text-sm my-1">
      {/* Strona lewa: Gospodarz */}
      <div className="flex-1 flex items-center justify-start gap-2">
        {isHome && (
          <>
            <span className="text-cyan-500 font-bold w-8">{ev.minute}'</span>
            <span className="text-slate-200">{ev.player_name}</span>
            {renderEventIcon(ev.event_type, ev.extra_info)}
          </>
        )}
      </div>

      {/* Strona prawa: Gość */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {!isHome && (
          <>
            {renderEventIcon(ev.event_type, ev.extra_info)}
            <span className="text-slate-200">{ev.player_name}</span>
            <span className="text-cyan-500 font-bold w-8">{ev.minute}'</span>
          </>
        )}
      </div>
    </div>
  );
})}
                   
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}