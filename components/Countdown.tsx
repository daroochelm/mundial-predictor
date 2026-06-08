import React from 'react';
import Countdown, { CountdownRenderProps } from 'react-countdown';

const WorldCupCountdown = () => {
  const wcDate = new Date('2026-06-11T15:00:00');

  // Funkcja renderująca własny format
  const renderer = ({ days, hours, minutes, seconds, completed }: CountdownRenderProps) => {
    if (completed) {
      return <span className="text-cyan-400 font-bold">World Cup 2026 już trwa!</span>;
    } else {
      return (
        <div className="flex justify-center gap-2 text-white font-mono">
          <span>{days} dni</span>
          <span>{hours} h</span>
          <span>{minutes} min</span>
          <span>{seconds} s</span>
        </div>
      );
    }
  };

  return (
    <div className="text-center py-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 my-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">Do rozpoczęcia World Cup 2026:</h2>
      <div className="text-xl md:text-2xl font-bold">
        <Countdown date={wcDate} renderer={renderer} />
      </div>
    </div>
  );
};

export default WorldCupCountdown;