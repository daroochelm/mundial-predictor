'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PredictionsBoard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAllPredictions() {
      const { data } = await supabase
        .from('predictions')
        .select(`
          home_score_guess, 
          away_score_guess, 
          match_id, 
          users(display_name),
          fixtures(home_team, away_team, start_time)
        `)
        .order('created_at', { ascending: false });
      
      if (data) setData(data);
    }
    fetchAllPredictions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Tablica Typów</h1>
      <div className="grid gap-2">
        {data.map((p, i) => (
          <div key={i} className="bg-slate-900 p-4 rounded-lg flex justify-between border border-slate-800">
            <div>
              <p className="font-bold">{p.users?.display_name}</p>
              <p className="text-xs text-slate-400">{p.fixtures?.home_team} - {p.fixtures?.away_team}</p>
            </div>
            <div className="text-xl font-mono font-bold text-cyan-400">
              {p.home_score_guess} : {p.away_score_guess}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}