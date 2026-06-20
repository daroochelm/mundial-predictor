'use client';
import { usePalette } from 'color-thief-react';

export default function DynamicBackground({ imgUrl, children }: { imgUrl: string, children: React.ReactNode }) {
  const { data: palette } = usePalette(imgUrl, 2, 'hex', { crossOrigin: 'anonymous' });
  const primaryColor = palette ? palette[0] : '#334155';

  return (
    <div className="relative w-full p-6 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <div 
        className="absolute inset-0 opacity-20 transition-colors duration-1000"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, #0f172a)` }}
      />
      <div className="absolute inset-0 bg-slate-900/80" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}