import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Pobieranie kluczy ze zmiennych środowiskowych Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!

// Inicjalizacja klienta z uprawnieniami administratora (omija RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    // 1. Ustalenie dzisiejszej daty
    const dzisiaj = new Date().toISOString().split("T")[0];
    
    // 2. Pobranie wszystkich dzisiejszych meczów
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${dzisiaj}`, {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
      },
    });

    const data = await response.json();
    console.log(`Pobrano z API-Football: ${data.results} wyników.`);

    const liveMatches = data.response || [];

    // 3. Mapowanie danych do formatu naszej tabeli
    const fixturesToInsert = liveMatches.map((match: any) => ({
      id: match.fixture.id,
      home_team: match.teams.home.name,
      away_team: match.teams.away.name,
      home_score: match.goals.home ?? 0,
      away_score: match.goals.away ?? 0,
      status: match.fixture.status.short,
      start_time: match.fixture.date
    }));

    // 4. Bulk Insert - wysłanie wszystkiego jednym potężnym zapytaniem
    if (fixturesToInsert.length > 0) {
      const { error } = await supabase
        .from('fixtures')
        .upsert(fixturesToInsert);

      if (error) {
        console.error("Błąd zapisu do bazy:", error.message);
      } else {
        console.log(`ZAPISANO SUKCESEM ${fixturesToInsert.length} meczów do bazy!`);
      }
    } else {
      console.log("Brak meczów do zapisu.");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Przetworzono ${fixturesToInsert.length} meczów` 
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error("Błąd funkcji:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})