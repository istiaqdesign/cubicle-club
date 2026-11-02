import { memo } from 'react';
import { useOffice } from '../core/store';

// The room itself: wall, window, floor, coffee corner. The window and clock
// follow the office clock so the day visibly passes.

export const hourOf = (clock: number) => Math.floor(clock / 60) % 24;
export const isNight = (h: number) => h >= 19 || h < 6;

function skyFor(h: number): [string, string] {
  if (h >= 7 && h < 17) return ['#8FD3FF', '#D8F1FF'];
  if (h >= 17 && h < 19) return ['#FF9E7A', '#FFD58A'];
  if (h >= 5 && h < 7) return ['#FFC4A3', '#FFE7B8'];
  return ['#1D2352', '#3D3B7A'];
}

const BULB_COLORS = ['#FF7B8A', '#FFC53D', '#3CCB9A', '#52B8FF', '#A88BFF'];
const BULBS = Array.from({ length: 31 }, (_, i) => {
  const x = 20 + i * 40;
  return { x, y: 24 + 20 * Math.sin((Math.PI * (x % 320)) / 320), color: BULB_COLORS[i % BULB_COLORS.length], delay: (i % 5) * 0.4 };
});

function Window() {
  const hour = useOffice((s) => hourOf(s.clock));
  const [top, bottom] = skyFor(hour);
  const night = isNight(hour);
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <clipPath id="window-clip">
          <rect x="302" y="62" width="286" height="156" rx="10" />
        </clipPath>
      </defs>
      <rect x="290" y="50" width="310" height="180" rx="18" fill="#FFFDF8" />
      <rect x="302" y="62" width="286" height="156" rx="10" fill="url(#sky)" />
      <g clipPath="url(#window-clip)">
        {night ? (
          <g>
            <circle cx="520" cy="96" r="16" fill="#FFF3C4" />
            <circle cx="528" cy="90" r="14" fill={top} />
            {[330, 372, 410, 456, 560, 580].map((x, i) => (
              <circle key={x} className="twinkle" cx={x} cy={78 + (i % 3) * 14} r="1.8" fill="#fff" style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
          </g>
        ) : (
          <circle cx="520" cy="98" r="18" fill={hour >= 17 ? '#FFB45E' : '#FFE27A'} />
        )}
        <g className="cloud-drift" fill="#fff" opacity={night ? 0.25 : 0.9}>
          <ellipse cx="360" cy="100" rx="26" ry="10" />
          <ellipse cx="376" cy="92" rx="16" ry="10" />
          <ellipse cx="450" cy="126" rx="22" ry="8" />
        </g>
        {[
          [302, 168, 44, 60],
          [352, 150, 36, 80],
          [394, 176, 50, 50],
          [452, 140, 40, 90],
          [498, 164, 52, 60],
          [556, 152, 40, 80],
        ].map(([x, y, w, h]) => (
          <g key={x}>
            <rect x={x} y={y} width={w} height={h} rx="6" fill={night ? '#2E2D5E' : '#B6C7E6'} />
            {Array.from({ length: 4 }, (_, i) => (
              <rect key={i} x={x + 8 + (i % 2) * (w / 2 - 4)} y={y + 10 + Math.floor(i / 2) * 16} width="7" height="7" rx="2" fill={night ? (i % 3 ? '#FFD36B' : '#4A4880') : '#E3ECF8'} />
            ))}
          </g>
        ))}
      </g>
      <rect x="442" y="62" width="6" height="156" fill="#FFFDF8" />
      <rect x="302" y="136" width="286" height="6" fill="#FFFDF8" />
      <rect x="280" y="226" width="330" height="12" rx="6" fill="#F2DCC2" />
      <g transform="translate(560 200)">
        <path d="M10 6 Q2 -10 8 -18 Q14 -8 10 6 M10 6 Q16 -12 26 -12 Q22 0 10 6" fill="#5DBB7A" />
        <path d="M1 6 H20 L18 26 H3 Z" fill="#FF8A3D" />
      </g>
    </g>
  );
}

function WallClock() {
  const clock = useOffice((s) => Math.floor(s.clock));
  const minuteAngle = (clock % 60) * 6;
  const hourAngle = ((clock / 60) % 12) * 30;
  return (
    <g transform="translate(815 118)">
      <circle r="40" fill="#FFFDF8" stroke="#E2775A" strokeWidth="7" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={Math.sin((i * Math.PI) / 6) * 29} cy={-Math.cos((i * Math.PI) / 6) * 29} r={i % 3 === 0 ? 2.8 : 1.6} fill="#C9B3A0" />
      ))}
      <line x1="0" y1="0" x2="0" y2="-17" stroke="#3A2E2A" strokeWidth="4" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
      <line x1="0" y1="0" x2="0" y2="-26" stroke="#3A2E2A" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
      <circle r="3.5" fill="#E2775A" />
    </g>
  );
}

function StringLights() {
  const night = useOffice((s) => isNight(hourOf(s.clock)));
  return (
    <g className={night ? 'lights night' : 'lights'}>
      <path d="M0 24 Q160 64 320 24 T640 24 T960 24 T1280 24" fill="none" stroke="#8C6E5A" strokeWidth="2" />
      {BULBS.map((b) => (
        <g key={b.x}>
          <circle className="bulb-glow" cx={b.x} cy={b.y + 7} r="11" fill={b.color} style={{ animationDelay: `${b.delay}s` }} />
          <rect x={b.x - 2} y={b.y - 1} width="4" height="4" fill="#8C6E5A" />
          <ellipse cx={b.x} cy={b.y + 7} rx="4.5" ry="6" fill={b.color} />
        </g>
      ))}
    </g>
  );
}

export const Backdrop = memo(function Backdrop() {
  return (
    <svg className="backdrop" viewBox="0 0 1280 720" width="1280" height="720" aria-hidden="true">
      <defs>
        <pattern id="wall-stripes" width="48" height="300" patternUnits="userSpaceOnUse">
          <rect width="24" height="300" style={{ fill: 'var(--scene-wall-stripe)' }} />
        </pattern>
        <pattern id="floor-planks" width="180" height="46" patternUnits="userSpaceOnUse">
          <path d="M0 45.5 H180 M120 0 V46" style={{ stroke: 'var(--scene-floor-line)' }} strokeWidth="2" />
        </pattern>
      </defs>

      {/* wall */}
      <rect width="1280" height="300" style={{ fill: 'var(--scene-wall)' }} />
      <rect width="1280" height="300" fill="url(#wall-stripes)" opacity="0.6" />
      <rect y="282" width="1280" height="20" fill="#E8C9A6" />
      <rect y="282" width="1280" height="5" fill="#FFF1DD" />

      {/* floor */}
      <rect y="302" width="1280" height="418" style={{ fill: 'var(--scene-floor)' }} />
      <rect y="302" width="1280" height="418" fill="url(#floor-planks)" opacity="0.7" />
      <rect x="110" y="330" width="790" height="368" rx="70" style={{ fill: 'var(--scene-rug)' }} />
      <rect x="128" y="346" width="754" height="336" rx="58" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="1040" cy="668" rx="220" ry="46" fill="#F7C6B6" />

      <StringLights />
      <Window />

      {/* motivational poster */}
      <g transform="translate(646 66)">
        <rect width="104" height="132" rx="10" fill="#FFFDF8" stroke="#E8C9A6" strokeWidth="3" />
        <rect x="10" y="10" width="84" height="70" rx="6" fill="#CFE6D2" />
        <circle cx="72" cy="30" r="9" fill="#FFC53D" />
        <path d="M10 80 L38 44 L54 62 L66 50 L94 80 Z" fill="#7DBF94" />
        <path d="M33 51 L38 44 L43 51 Z" fill="#fff" />
        <text x="52" y="102" textAnchor="middle" className="poster-text">
          DREAM BIG
        </text>
        <text x="52" y="119" textAnchor="middle" className="poster-text small">
          nap often
        </text>
      </g>

      <WallClock />

      {/* coffee corner */}
      <g>
        <rect x="42" y="76" width="96" height="30" rx="8" fill="#C98F5E" />
        <text x="90" y="97" textAnchor="middle" className="poster-text light">
          FUEL
        </text>
        <rect x="24" y="212" width="190" height="76" rx="10" fill="#E2A877" />
        <rect x="34" y="226" width="80" height="50" rx="7" fill="#000" opacity="0.07" />
        <rect x="124" y="226" width="80" height="50" rx="7" fill="#000" opacity="0.07" />
        <rect x="16" y="200" width="206" height="16" rx="8" fill="#FFF1DD" />
        <rect x="40" y="124" width="72" height="78" rx="14" fill="#5A4A5E" />
        <rect x="50" y="134" width="52" height="20" rx="6" fill="#3D3241" />
        <circle cx="60" cy="144" r="4" fill="#3CCB9A" />
        <rect x="70" y="140" width="24" height="8" rx="3" fill="#FFC53D" opacity="0.8" />
        <rect x="68" y="160" width="16" height="10" rx="3" fill="#2E2635" />
        <rect x="64" y="182" width="24" height="18" rx="4" fill="#fff" />
        <g className="steam" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M71 178 q-3 -5 0 -9" />
          <path d="M80 178 q-3 -5 0 -9" />
        </g>
        <rect x="128" y="162" width="40" height="40" rx="9" fill="#fff" opacity="0.65" stroke="#E8C9A6" strokeWidth="2" />
        <circle cx="140" cy="182" r="7" fill="#C98F5E" />
        <circle cx="156" cy="190" r="7" fill="#C98F5E" />
        <circle cx="152" cy="176" r="6" fill="#D9A06A" />
        <rect x="126" y="156" width="44" height="8" rx="4" fill="#FF8A3D" />
        <rect x="180" y="178" width="16" height="22" rx="4" fill="#52B8FF" />
        <rect x="196" y="184" width="14" height="16" rx="4" fill="#FF7B8A" />
      </g>

      {/* big plant in the corner */}
      <g transform="translate(1222 230)">
        <path d="M22 4 Q0 -40 14 -76 Q30 -40 22 4 M22 4 Q40 -50 64 -58 Q56 -18 22 4 M22 4 Q-8 -20 -18 -46 Q12 -40 22 4" fill="#4CAF6E" />
        <path d="M22 4 Q24 -30 38 -46 Q40 -16 22 4" fill="#5DBB7A" />
        <path d="M0 2 H46 L40 58 H6 Z" fill="#E9876A" />
        <rect x="-3" y="0" width="52" height="9" rx="4.5" fill="#D9705A" />
      </g>
    </svg>
  );
});
