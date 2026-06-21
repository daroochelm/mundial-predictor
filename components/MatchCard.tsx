import { getTeamColor } from '@/lib/teamColors';

export default function MatchCard({ homeTeam, awayTeam, homeScore, awayScore, status, minute, homeLogo, awayLogo, startTime, halftimeScore }: any) {
  const homeColor = getTeamColor(homeTeam);
  const awayColor = getTeamColor(awayTeam);
  const isLive = ['1H', '2H', 'HT', 'ET'].includes(status);
  const isNotStarted = status === 'NS';

  return (
    <div className="relative w-full p-6 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <div 
        className="absolute inset-0 opacity-50 blur-xl transition-colors duration-1000"
        style={{ background: `linear-gradient(135deg, ${homeColor}, ${awayColor})` }}
      />
      <div className="absolute inset-0 bg-slate-900/60" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6 px-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date(startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/5 flex items-center gap-2">
            {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
              {status === 'HT' ? 'HT' : isLive ? `${minute}'` : isNotStarted ? 'Nie rozpoczęty' : status}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <div className="flex flex-col items-center gap-2 flex-1">
            <img src={homeLogo} className="w-10 h-10 rounded-full" alt={homeTeam} />
            <span className="text-xs font-bold text-slate-200 text-center truncate w-full">{homeTeam}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            {/* ZMIANA: Wyświetlamy - : - zamiast 0 : 0 dla meczów NS */}
            <div className="flex items-center gap-3 text-3xl font-black text-white tabular-nums px-4">
              {isNotStarted ? (
                <>
                  <span>-</span>
                  <span className="text-slate-600 font-light">:</span>
                  <span>-</span>
                </>
              ) : (
                <>
                  <span>{homeScore ?? 0}</span>
                  <span className="text-slate-600 font-light">:</span>
                  <span>{awayScore ?? 0}</span>
                </>
              )}
            </div>
            {halftimeScore && <span className="text-[10px] text-slate-500 font-bold uppercase">HT: {halftimeScore}</span>}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <img src={awayLogo} className="w-10 h-10 rounded-full" alt={awayTeam} />
            <span className="text-xs font-bold text-slate-200 text-center truncate w-full">{awayTeam}</span>
          </div>
        </div>
      </div>
    </div>
  );
}