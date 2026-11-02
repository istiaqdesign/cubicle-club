import type { CSSProperties } from 'react';
import { PET_STAGES, petStage, usePet, type Species } from '../pet/petStore';
import { petThePet, usePetScene, type PetMode } from '../pet/petBrain';

const INK = '#3A2E2A';

const COATS: Record<Species, { body: string; dark: string; belly: string }> = {
  cat: { body: '#F4A259', dark: '#D9822B', belly: '#FFE2C2' },
  pup: { body: '#EBCB9F', dark: '#9C6B46', belly: '#FFF3E0' },
};

/** The office pet, drawn in SVG. Side view, facing right. Stage adds accessories. */
export function PetSprite({ species, mode, stage }: { species: Species; mode: PetMode; stage: number }) {
  const c = COATS[species];
  const asleep = mode === 'sleep';
  const happy = mode === 'happy';
  const head = asleep ? 'translate(-4 9)' : undefined;
  return (
    <svg viewBox="0 0 84 66" className={`pet-svg mode-${mode}`} aria-hidden="true">
      {/* tail */}
      {species === 'cat' ? (
        <path className="pet-tail" d={asleep ? 'M16 54 Q2 56 8 44 Q12 40 18 46' : 'M16 44 Q2 40 6 24 Q8 16 14 20'} fill="none" stroke={c.body} strokeWidth="6" strokeLinecap="round" />
      ) : (
        <path className="pet-tail wag" d="M17 42 Q8 36 9 26" fill="none" stroke={c.body} strokeWidth="6" strokeLinecap="round" />
      )}
      {/* legs */}
      {!asleep && (
        <g fill={c.body}>
          <rect className="leg-b1" x="20" y="48" width="8" height="15" rx="4" />
          <rect className="leg-b2" x="29" y="48" width="8" height="15" rx="4" />
          <rect className="leg-f1" x="44" y="48" width="8" height="15" rx="4" />
          <rect className="leg-f2" x="53" y="48" width="8" height="15" rx="4" />
        </g>
      )}
      {/* body */}
      <ellipse cx="38" cy={asleep ? 52 : 44} rx="24" ry={asleep ? 12 : 13} fill={c.body} />
      <ellipse cx="42" cy={asleep ? 56 : 49} rx="15" ry="6" fill={c.belly} />
      {species === 'cat' && (
        <g stroke={c.dark} strokeWidth="3" strokeLinecap="round" fill="none" transform={asleep ? 'translate(0 8)' : undefined}>
          <path d="M26 33 Q28 38 26 42" />
          <path d="M33 31 Q35 37 33 41" />
          <path d="M40 31 Q42 36 40 40" />
        </g>
      )}
      {/* head */}
      <g transform={head}>
        {species === 'cat' ? (
          <g>
            <path d="M49 22 L51 6 L61 17 Z" fill={c.body} />
            <path d="M65 16 L74 5 L76 22 Z" fill={c.body} />
            <path d="M52 18 L53 10 L58 16 Z M68 15 L73 9 L74 18 Z" fill="#FFB3C1" />
          </g>
        ) : null}
        <circle cx="63" cy="31" r="15" fill={c.body} />
        {species === 'pup' && (
          <g>
            <ellipse cx="51" cy="30" rx="6" ry="12" fill={c.dark} transform="rotate(18 51 30)" />
            <ellipse cx="73" cy="22" rx="5" ry="6" fill={c.dark} opacity="0.85" />
            <ellipse cx="70" cy="37" rx="9" ry="7" fill={c.belly} />
          </g>
        )}
        {asleep ? (
          <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M56 30 Q59 33 62 30" />
            <path d="M67 30 Q70 33 73 30" />
          </g>
        ) : happy ? (
          <g stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M56 31 Q59 26 62 31" />
            <path d="M67 31 Q70 26 73 31" />
          </g>
        ) : (
          <g fill={INK}>
            <ellipse className="pet-eye" cx="59" cy="29" rx="2.4" ry="3.2" />
            <ellipse className="pet-eye" cx="70" cy="29" rx="2.4" ry="3.2" />
            <circle cx="60" cy="28" r="0.9" fill="#fff" />
            <circle cx="71" cy="28" r="0.9" fill="#fff" />
          </g>
        )}
        <ellipse cx="55" cy="36" rx="3.4" ry="2" fill="#FF8FA3" opacity="0.6" />
        <ellipse cx="76" cy="36" rx="3" ry="2" fill="#FF8FA3" opacity="0.6" />
        <path d={species === 'cat' ? 'M63.5 34 l2.5 0 l-1.25 1.8 z' : 'M62 33.5 h6 q0 3 -3 3.5 q-3 -0.5 -3 -3.5 z'} fill={species === 'cat' ? '#FF7B8A' : INK} />
        <path d="M61.5 37.5 Q63.5 39.5 65 37.5 Q66.5 39.5 68.5 37.5" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {happy && species === 'pup' && <path d="M64 39 q1 6 3 0 z" fill="#FF7B8A" />}
        {species === 'cat' && (
          <g stroke={INK} strokeWidth="0.9" opacity="0.55" strokeLinecap="round">
            <path d="M72 35 L81 33 M72 37 L81 38" />
            <path d="M55 35 L47 33 M55 37 L47 38" />
          </g>
        )}
        {/* growing up: collar, bandana, crown */}
        {stage >= 1 && (
          <g>
            <path d="M52 42 Q63 49 74 42" fill="none" stroke="#FF5C6C" strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="63" cy="47" r="2.6" fill="#FFC53D" stroke="#D99A12" strokeWidth="0.8" />
          </g>
        )}
        {stage >= 2 && <path d="M55 44 L71 44 L63 54 Z" fill="#52B8FF" stroke="#2A8FD6" strokeWidth="1" strokeLinejoin="round" />}
        {stage >= 3 && (
          <path d="M54 15 L56 5 L60 11 L63.5 3 L67 11 L71 5 L73 15 Z" fill="#FFC53D" stroke="#D99A12" strokeWidth="1.2" strokeLinejoin="round" />
        )}
      </g>
    </svg>
  );
}

/** The pet in the office, positioned and animated by petBrain. */
export function OfficePet() {
  const p = usePetScene();
  const pet = usePet();
  const stage = petStage(pet.xp);
  const scale = PET_STAGES[stage].scale;
  return (
    <div
      className={`pet ${p.zoomies ? 'zoomies' : ''}`}
      style={{ transform: `translate(${p.x - 52}px, ${p.y - 82}px)`, transitionDuration: `${p.dur}ms`, zIndex: Math.round(p.y) + 2 } as CSSProperties}
      onClick={petThePet}
      role="button"
      tabIndex={0}
      aria-label={`${pet.name} the office ${pet.species}. Click to pet.`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && petThePet()}
    >
      <div className="pet-scale" style={{ transform: `scale(${scale})` }}>
        <div className="pet-flip" style={{ transform: `scaleX(${p.facing})` }}>
          <div key={p.jump} className={`pet-anim ${p.mode === 'walk' ? 'walking' : ''} ${p.jump ? 'jump' : ''}`}>
            <PetSprite species={pet.species} mode={p.mode} stage={stage} />
          </div>
        </div>
      </div>
      {p.mode === 'sleep' && (
        <div className="zzz pet-zzz" aria-hidden="true">
          <span>z</span>
          <span>z</span>
        </div>
      )}
      {p.hearts > 0 && (
        <div key={`hearts-${p.hearts}`} className="pet-hearts" aria-hidden="true">
          <i>♥</i>
          <i>♥</i>
          <i>♥</i>
        </div>
      )}
      {p.sound && (
        <div key={`sound-${p.sound.key}`} className="bubble pet-bubble">
          {p.sound.text}
        </div>
      )}
    </div>
  );
}
