import { useId, type ReactNode } from 'react';
import type { RoleId } from '../core/types';
import { ROLES, type Look, type Outfit } from '../content/roster';
import type { Prop } from './sceneStore';

// One original "toy" character, drawn in SVG. Everything is parameterized so
// new agents, outfits and themes are just data.

export type ArmPose = 'rest' | 'type' | 'hold' | 'up' | 'mug' | 'clap' | 'phone' | 'juggle';
export type Expression = 'neutral' | 'focus' | 'joy' | 'sad' | 'sleep' | 'tired' | 'smug';

const INK = '#3A2E2A';
const ARM_ANGLES: Record<ArmPose, [number, number]> = {
  rest: [8, -8],
  type: [-32, 32],
  hold: [-40, 40],
  up: [150, -150],
  mug: [8, 128],
  clap: [-36, 36],
  phone: [-46, 46],
  juggle: [165, -165],
};

// Which arm poses get a looping animation on the hands.
const ARM_LOOP: Partial<Record<ArmPose, string>> = { type: 'type', clap: 'clap', juggle: 'juggle' };

interface Props {
  look: Look;
  role: RoleId;
  arms?: ArmPose;
  expression?: Expression;
  prop?: Prop;
  headOnly?: boolean;
  className?: string;
}

export function AgentSprite({ look, role, arms = 'rest', expression = 'neutral', prop = 'none', headOnly, className }: Props) {
  const c = ROLES[role];
  const [back, front] = hair(look, c.dark);
  const [left, right] = ARM_ANGLES[arms];
  const loop = ARM_LOOP[arms];

  return (
    <svg viewBox={headOnly ? '10 0 80 80' : '0 0 100 140'} className={className} aria-hidden="true">
      {!headOnly && (
        <>
          <g className="leg-l">
            <rect x="35" y="108" width="12" height="26" rx="6" fill="#4B3F5C" />
            <ellipse cx="40" cy="135" rx="9" ry="4.5" fill="#2E2635" />
          </g>
          <g className="leg-r">
            <rect x="53" y="108" width="12" height="26" rx="6" fill="#4B3F5C" />
            <ellipse cx="60" cy="135" rx="9" ry="4.5" fill="#2E2635" />
          </g>
          <path d={TORSO} style={{ fill: c.color }} />
          <path d="M42 68 L50 79 L58 68 Z" fill="#FFFDF8" />
          <OutfitLayer outfit={look.outfit ?? 'tee'} dark={c.dark} />
          {look.accessory === 'tie' && <path d="M48 75 L52 75 L54.5 93 L50 98 L45.5 93 Z" style={{ fill: c.dark }} />}
        </>
      )}
      {back}
      <circle cx="23.5" cy="45" r="5.5" fill={look.skin} />
      <circle cx="76.5" cy="45" r="5.5" fill={look.skin} />
      <circle cx="50" cy="42" r="27" fill={look.skin} />
      <Face expression={expression} />
      {front}
      <AccessoryLayer look={look} dark={c.dark} />
      {!headOnly && (
        <>
          <Arm side="l" angle={left} sleeve={c.color} edge={c.dark} skin={look.skin} loop={loop} />
          <Arm side="r" angle={right} sleeve={c.color} edge={c.dark} skin={look.skin} loop={loop} />
          {arms === 'mug' && <Mug />}
          {arms === 'phone' && <Phone />}
          {arms === 'juggle' && <JuggleBalls />}
          {prop !== 'none' && prop !== 'mug' && <PropLayer prop={prop} skin={look.skin} />}
        </>
      )}
    </svg>
  );
}

const TORSO = 'M24 94 Q24 68 50 68 Q76 68 76 94 L76 112 Q76 118 70 118 L30 118 Q24 118 24 112 Z';
const DENIM = '#5B7DB8';

/** Clothes drawn over the role-colored shirt. */
function OutfitLayer({ outfit, dark }: { outfit: Outfit; dark: string }) {
  const clip = useId();
  switch (outfit) {
    case 'hoodie':
      return (
        <g>
          <path d="M31 75 Q50 88 69 75 Q66 66 50 66 Q34 66 31 75 Z" style={{ fill: dark }} />
          <path d="M45 79 L44 93 M55 79 L56 93" stroke="#FFFDF8" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="36" y="99" width="28" height="12" rx="5" style={{ fill: dark }} opacity="0.55" />
        </g>
      );
    case 'blazer':
      return (
        <g>
          <path d="M42.5 68 L50 90 L57.5 68 Z" fill="#FFFDF8" />
          <path d="M42 68 L50 91 L35 75 Z M58 68 L50 91 L65 75 Z" style={{ fill: dark }} />
          <circle cx="50" cy="99" r="1.8" style={{ fill: dark }} />
          <circle cx="50" cy="107" r="1.8" style={{ fill: dark }} />
        </g>
      );
    case 'stripes':
      return (
        <g>
          <clipPath id={clip}>
            <path d={TORSO} />
          </clipPath>
          <g clipPath={`url(#${clip})`} fill="#FFFDF8" opacity="0.6">
            {[82, 92, 102, 112].map((y) => (
              <rect key={y} x="20" y={y} width="60" height="4.5" />
            ))}
          </g>
        </g>
      );
    case 'overalls':
      return (
        <g>
          <path d="M38 86 L33 70 M62 86 L67 70" stroke={DENIM} strokeWidth="4.5" strokeLinecap="round" />
          <rect x="36" y="85" width="28" height="22" rx="4" fill={DENIM} />
          <path d="M25 103 H75 V112 Q75 118 69 118 H31 Q25 118 25 112 Z" fill={DENIM} />
          <circle cx="39.5" cy="88.5" r="2" fill="#FFC53D" />
          <circle cx="60.5" cy="88.5" r="2" fill="#FFC53D" />
          <rect x="44" y="92" width="12" height="8" rx="2" fill="#4A6AA3" />
        </g>
      );
    default:
      return null;
  }
}

function Arm({ side, angle, sleeve, edge, skin, loop }: { side: 'l' | 'r'; angle: number; sleeve: string; edge: string; skin: string; loop?: string }) {
  const sx = side === 'l' ? 27 : 73;
  return (
    <g className="arm" style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${sx}px 74px` }}>
      <g className={loop ? `${loop}-${side}` : undefined}>
        <rect x={sx - 6} y={72} width={12} height={30} rx={6} style={{ fill: sleeve, stroke: edge }} strokeWidth="1.5" />
        <circle cx={sx} cy={105} r={6} fill={skin} />
      </g>
    </g>
  );
}

function Face({ expression }: { expression: Expression }) {
  let eyes: ReactNode;
  switch (expression) {
    case 'joy':
      eyes = (
        <g stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M36 48 Q40 42 44 48" />
          <path d="M56 48 Q60 42 64 48" />
        </g>
      );
      break;
    case 'smug':
      eyes = (
        <g stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M36 47 Q40 44 44 47" />
          <path d="M56 47 Q60 44 64 47" />
        </g>
      );
      break;
    case 'sleep':
      eyes = (
        <g stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M36 46 Q40 50 44 46" />
          <path d="M56 46 Q60 50 64 46" />
        </g>
      );
      break;
    case 'tired':
      eyes = (
        <g>
          <ellipse cx="40" cy="48" rx="3.3" ry="2.2" fill={INK} />
          <ellipse cx="60" cy="48" rx="3.3" ry="2.2" fill={INK} />
          <path d="M35.5 45.5 H44.5 M55.5 45.5 H64.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M73 27 q4 6 0 9 q-4 -3 0 -9 Z" fill="#9ED8FF" stroke="#6BB8E8" strokeWidth="1" />
        </g>
      );
      break;
    default:
      eyes = (
        <g className="eyes">
          <ellipse cx="40" cy="46" rx="3.3" ry="4.2" fill={INK} />
          <ellipse cx="60" cy="46" rx="3.3" ry="4.2" fill={INK} />
          <circle cx="41.3" cy="44.3" r="1.1" fill="#fff" />
          <circle cx="61.3" cy="44.3" r="1.1" fill="#fff" />
        </g>
      );
  }

  const mouths: Record<Expression, ReactNode> = {
    neutral: <path d="M45 57 Q50 61 55 57" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    focus: <path d="M46 58 Q50 59.5 54 58" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    joy: <path d="M43 55 Q50 66 57 55 Z" fill="#7A3B3B" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
    smug: <path d="M44 56 Q51 62 57 55" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    sad: <path d="M45 60 Q50 56 55 60" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    sleep: <ellipse cx="50" cy="59" rx="2.4" ry="2" fill="none" stroke={INK} strokeWidth="1.8" />,
    tired: <path d="M44 59 Q47 57 50 59 Q53 61 56 59" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
  };

  return (
    <g>
      <ellipse cx="33" cy="54" rx="5" ry="3" fill="#FF8FA3" opacity="0.5" />
      <ellipse cx="67" cy="54" rx="5" ry="3" fill="#FF8FA3" opacity="0.5" />
      {eyes}
      {expression === 'sad' && <path d="M35 39 L44 36 M65 39 L56 36" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
      {mouths[expression]}
    </g>
  );
}

function hair(look: Look, dark: string): [ReactNode, ReactNode] {
  const fill = look.hair;
  switch (look.hairStyle) {
    case 'bun':
      return [
        <circle key="b" cx="50" cy="13" r="9" fill={fill} />,
        <path key="f" d="M24 40 Q24 14 50 14 Q76 14 76 40 Q66 26 50 27 Q34 26 24 40 Z" fill={fill} />,
      ];
    case 'messy':
      return [null, <path key="f" d="M23 42 Q20 18 38 14 L42 7 L49 13 L56 6 L60 14 Q80 18 77 42 Q72 29 60 28 L54 33 L48 27 Q33 28 23 42 Z" fill={fill} />];
    case 'bob':
      return [
        <path key="b" d="M19 48 Q16 13 50 12 Q84 13 81 48 L81 62 Q74 65 71 58 L29 58 Q26 65 19 62 Z" fill={fill} />,
        <path key="f" d="M23 40 Q25 15 50 15 Q75 15 77 40 Q68 31 58 34 Q51 27 44 33 Q33 30 23 40 Z" fill={fill} />,
      ];
    case 'wavy':
      return [
        <path key="b" d="M19 48 Q13 15 50 12 Q87 15 81 48 Q85 63 77 74 Q70 64 73 52 L27 52 Q30 64 23 74 Q15 63 19 48 Z" fill={fill} />,
        <path key="f" d="M23 41 Q25 15 52 14 Q77 16 78 37 Q63 24 46 30 Q34 34 23 41 Z" fill={fill} />,
      ];
    case 'beanie':
      return [
        null,
        <g key="f">
          <path d="M22 38 Q22 10 50 10 Q78 10 78 38 Z" style={{ fill: dark }} />
          <rect x="20" y="31" width="60" height="10" rx="5" style={{ fill: dark }} />
          <rect x="20" y="31" width="60" height="10" rx="5" fill="#fff" opacity="0.18" />
          <circle cx="50" cy="9" r="6" style={{ fill: dark }} />
        </g>,
      ];
    default:
      return [null, <path key="f" d="M24 40 Q24 14 50 14 Q76 14 76 40 Q66 26 50 27 Q34 26 24 40 Z" fill={fill} />];
  }
}

function AccessoryLayer({ look, dark }: { look: Look; dark: string }) {
  switch (look.accessory) {
    case 'glasses':
      return (
        <g stroke={INK} strokeWidth="2.2" fill="rgba(255,255,255,0.3)">
          <circle cx="40" cy="46" r="7.5" />
          <circle cx="60" cy="46" r="7.5" />
          <path d="M47.5 46 H52.5" fill="none" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M20 44 Q20 4 50 4 Q80 4 80 44" fill="none" style={{ stroke: dark }} strokeWidth="5" strokeLinecap="round" />
          <rect x="13" y="36" width="11" height="20" rx="5.5" style={{ fill: dark }} />
          <rect x="76" y="36" width="11" height="20" rx="5.5" style={{ fill: dark }} />
        </g>
      );
    case 'pencil':
      return (
        <g transform="rotate(35 74 24)">
          <rect x="71" y="10" width="6" height="24" rx="1.5" fill="#FFC53D" />
          <rect x="71" y="10" width="6" height="4" fill="#FF7B8A" />
          <path d="M71 34 L74 40 L77 34 Z" fill="#F6D2B4" />
        </g>
      );
    case 'beret':
      return (
        <g>
          <ellipse cx="54" cy="16" rx="25" ry="9" transform="rotate(-10 54 16)" style={{ fill: dark }} />
          <circle cx="57" cy="6" r="3" style={{ fill: dark }} />
        </g>
      );
    default:
      return null;
  }
}

function Mug() {
  return (
    <g>
      <g className="steam" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8">
        <path d="M42 48 q-2 -4 0 -7" />
        <path d="M47 48 q-2 -4 0 -7" />
      </g>
      <rect x="38" y="50" width="13" height="14" rx="3" fill="#fff" stroke="#D9C9B6" strokeWidth="1.4" />
      <path d="M51 53 q5 0 5 4.5 q0 4.5 -5 4.5" fill="none" stroke="#D9C9B6" strokeWidth="2" />
      <rect x="38" y="55" width="13" height="3" fill="#FF8A3D" opacity="0.8" />
    </g>
  );
}

function Phone() {
  return (
    <g>
      <rect x="42" y="80" width="16" height="25" rx="3.5" fill="#3D3241" />
      <rect x="44" y="83" width="12" height="18" rx="2" fill="#9FE3FF" className="phone-screen" />
    </g>
  );
}

function JuggleBalls() {
  return (
    <g>
      <circle className="ball b1" cx="50" cy="14" r="5" fill="#FF7B8A" />
      <circle className="ball b2" cx="50" cy="14" r="5" fill="#52B8FF" />
      <circle className="ball b3" cx="50" cy="14" r="5" fill="#FFC53D" />
    </g>
  );
}

function PropLayer({ prop, skin }: { prop: Prop; skin: string }) {
  return (
    <g>
      {prop === 'trophy' ? (
        <g className="trophy">
          <path d="M34 72 Q26 72 26 80 Q26 88 36 89 M66 72 Q74 72 74 80 Q74 88 64 89" fill="none" stroke="#E0A215" strokeWidth="3.5" />
          <path d="M34 68 H66 V80 Q66 94 50 96 Q34 94 34 80 Z" fill="#FFC53D" stroke="#E0A215" strokeWidth="2" />
          <path d="M40 72 V84" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <rect x="46" y="95" width="8" height="7" fill="#E0A215" />
          <rect x="38" y="101" width="24" height="8" rx="2" fill="#8C6E5A" />
        </g>
      ) : prop === 'box' ? (
        <g>
          <path d="M42 78 Q36 60 44 52 Q48 64 42 78 M42 78 Q50 58 60 58 Q56 70 42 78" fill="#5DBB7A" />
          <rect x="54" y="62" width="8" height="18" rx="2" fill="#FFC53D" transform="rotate(12 58 70)" />
          <path d="M26 76 H74 L70 110 H30 Z" fill="#D9A06A" stroke="#B57E4C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M26 76 L20 68 M74 76 L80 68" stroke="#B57E4C" strokeWidth="3" strokeLinecap="round" />
          <rect x="40" y="86" width="20" height="8" rx="2" fill="#FFFDF8" opacity="0.8" />
        </g>
      ) : prop === 'folder' ? (
        <g>
          <rect x="31" y="74" width="16" height="8" rx="2" fill="#E9B44C" />
          <rect x="33" y="76" width="34" height="6" fill="#FFFDF8" />
          <rect x="29" y="79" width="42" height="29" rx="3" fill="#F6C75E" stroke="#D9A23A" strokeWidth="1.5" />
        </g>
      ) : (
        <g>
          <rect x="31" y="70" width="38" height="40" rx="3" fill="#fff" stroke="#E0D3C3" strokeWidth="1.5" />
          <path d="M36 79 H64 M36 86 H64 M36 93 H56" stroke="#CDBFAE" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="101" r="5" fill="none" stroke="#FF5C6C" strokeWidth="1.6" />
        </g>
      )}
      <circle cx="30" cy="96" r="6" fill={skin} />
      <circle cx="70" cy="96" r="6" fill={skin} />
    </g>
  );
}
