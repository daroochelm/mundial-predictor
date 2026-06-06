import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Weryfikacja tajnego klucza, aby nikt obcy nie wywoływał Twoich cronów
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'live';

  try {
    // Wywołanie Twojej Edge Function w Supabase
    const response = await fetch(`${process.env.SUPABASE_EDGE_FUNCTION_URL}?mode=${mode}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json({ success: true, mode, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}