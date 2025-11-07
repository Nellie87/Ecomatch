import { useEffect, useState } from 'react';

// 6s sequence ~ (1) birth 0-1.5s, (2) expansion 1.5-4s, (3) dissolve 4-6s
export default function EchoSplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'birth'|'expand'|'dissolve'|'done'>('birth');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('expand'), 1500);
    const t2 = setTimeout(() => setPhase('dissolve'), 4000);
    const t3 = setTimeout(() => { setPhase('done'); onDone(); }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center" style={{ background: 'linear-gradient(180deg,#FFFFFF 0%, #F3F3F3 100%)' }}>
      <div className="relative flex items-center justify-center">
        <div 
          className={`w-[240px] h-[240px] rounded-full ${phase === 'birth' ? 'animate-pulseBirth' : phase === 'expand' ? 'animate-expand animate-ripple' : 'animate-dissolve'}`}
          style={{
            background: 'radial-gradient(closest-side, #FFFFFF 0%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0) 70%)',
            boxShadow: '0 0 120px 60px rgba(30,144,255,0.28), 0 0 220px 120px rgba(115,184,255,0.22)',
            filter: phase === 'dissolve' ? 'blur(8px)' : 'blur(0.2px)',
          }}
        />
        <div 
          className={`absolute font-extrabold text-black ${phase === 'birth' ? 'opacity-0' : 'opacity-100 transition-opacity duration-900'}`}
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            letterSpacing: '0.02em',
            fontSize: 'clamp(28px, 4vw, 56px)',
          }}
        >
          EchoMatch
        </div>
      </div>
    </div>
  );
}

