import { useMemo, type CSSProperties } from 'react';

const CONFETTI_COLORS = ['#FF7B8A', '#52B8FF', '#FFC53D', '#3CCB9A', '#A88BFF', '#FF8A3D'];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        dx: (Math.random() - 0.5) * 170,
        dy: -60 - Math.random() * 90,
        r: Math.random() * 720 - 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 120,
        round: Math.random() < 0.3,
      })),
    [],
  );
  return (
    <div className="confetti">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={
            {
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--r': `${p.r}deg`,
              background: p.color,
              animationDelay: `${p.delay}ms`,
              borderRadius: p.round ? '50%' : '2px',
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function RainCloud() {
  return (
    <div className="rain">
      <svg viewBox="0 0 80 44" aria-hidden="true">
        <path d="M18 38 Q4 38 6 26 Q8 16 20 18 Q24 6 38 8 Q50 2 58 14 Q72 12 74 26 Q76 38 62 38 Z" fill="#A3AEC2" />
        <path d="M18 38 Q4 38 6 26 Q30 34 74 26 Q76 38 62 38 Z" fill="#8E9AB0" />
      </svg>
      <i className="drop" style={{ left: '28%' }} />
      <i className="drop" style={{ left: '50%', animationDelay: '0.25s' }} />
      <i className="drop" style={{ left: '70%', animationDelay: '0.5s' }} />
    </div>
  );
}

export function DeskBug() {
  return (
    <g className="desk-bug">
      <g stroke="#3A2E2A" strokeWidth="1.4" strokeLinecap="round">
        <path d="M-6 -2 L-10 -5 M-6 2 L-10 4 M6 -2 L10 -5 M6 2 L10 4 M0 -3 L0 -6" />
      </g>
      <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#F2545B" />
      <path d="M0 -5.5 V5.5" stroke="#3A2E2A" strokeWidth="1.2" />
      <circle cx="-3" cy="-1" r="1.2" fill="#3A2E2A" />
      <circle cx="3" cy="1.5" r="1.2" fill="#3A2E2A" />
      <circle cx="-8" cy="-1" r="2.6" fill="#3A2E2A" />
    </g>
  );
}

export function ProudStar() {
  return (
    <svg className="proud-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#FFC53D" stroke="#E0A215" strokeWidth="1.2" />
    </svg>
  );
}
