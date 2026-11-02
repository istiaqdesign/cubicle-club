import { useEffect, useState, type ReactNode } from 'react';
import { closeDressingRoom, useOffice } from '../core/store';
import {
  ACCESSORIES,
  DESK_ITEMS,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFITS,
  ROLES,
  SKIN_TONES,
  resetLook,
  updateLook,
  useLook,
  type Look,
} from '../content/roster';
import type { RoleId } from '../core/types';
import { AgentSprite, type ArmPose, type Expression } from '../scene/AgentSprite';
import { play } from '../audio/sfx';
import { Icon, Modal } from './bits';

const LABELS: Record<string, string> = {
  short: 'Short',
  messy: 'Messy',
  bob: 'Bob',
  wavy: 'Wavy',
  bun: 'Bun',
  beanie: 'Beanie',
  none: 'Nothing',
  glasses: 'Glasses',
  headphones: 'Headphones',
  pencil: 'Ear pencil',
  beret: 'Beret',
  tie: 'Tie',
  plant: 'Plant',
  books: 'Books',
  lamp: 'Lamp',
  cactus: 'Cactus',
  pens: 'Pen cup',
  tee: 'Tee',
  hoodie: 'Hoodie',
  blazer: 'Blazer',
  stripes: 'Stripes',
  overalls: 'Overalls',
};

// The preview strikes a few poses so you can see the outfit in action.
const POSES: [ArmPose, Expression][] = [
  ['up', 'joy'],
  ['rest', 'neutral'],
  ['clap', 'joy'],
  ['phone', 'smug'],
];

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dr-section">
      <h4>{title}</h4>
      <div className="dr-options">{children}</div>
    </section>
  );
}

export function DressingRoom() {
  const id = useOffice((s) => s.ui.dressAgentId);
  const agent = useOffice((s) => (id ? s.agents[id] : undefined));
  if (!id || !agent) return null;
  return <Room id={id} name={agent.info.name} role={agent.info.role} />;
}

function Room({ id, name, role }: { id: string; name: string; role: RoleId }) {
  const look = useLook(id);
  const [pose, setPose] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPose((p) => (p + 1) % POSES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const set = (patch: Partial<Look>) => {
    updateLook(id, patch);
    play('pop');
  };
  const randomize = () =>
    set({
      skin: pick(SKIN_TONES),
      hair: pick(HAIR_COLORS),
      hairStyle: pick(HAIR_STYLES),
      accessory: pick(ACCESSORIES),
      outfit: pick(OUTFITS),
      deskItem: pick(DESK_ITEMS),
    });

  const [arms, expression] = POSES[pose];
  const chip = <K extends keyof Look>(key: K, value: Look[K], content: ReactNode, label: string) => (
    <button key={String(value)} className={`dr-chip ${look[key] === value || (key === 'outfit' && !look.outfit && value === 'tee') ? 'on' : ''}`} onClick={() => set({ [key]: value } as Partial<Look>)} aria-label={label} title={label}>
      {content}
    </button>
  );
  const head = (patch: Partial<Look>) => (
    <span className="dr-head">
      <AgentSprite look={{ ...look, ...patch }} role={role} headOnly />
    </span>
  );
  const body = (patch: Partial<Look>) => (
    <span className="dr-body">
      <AgentSprite look={{ ...look, ...patch }} role={role} />
    </span>
  );

  return (
    <Modal onClose={closeDressingRoom} className="dressing-room" label={`Dress up ${name}`}>
      <div className="dr-layout">
        <div className="dr-stage" style={{ background: ROLES[role].color }}>
          <div className="dr-mirror">
            <AgentSprite look={look} role={role} arms={arms} expression={expression} />
          </div>
          <div className="dr-name">{name}</div>
          <div className="dr-actions">
            <button className="btn btn-paper btn-small" onClick={randomize}>
              <Icon name="dice" /> Surprise me
            </button>
            <button className="btn btn-paper btn-small" onClick={() => resetLook(id)}>
              <Icon name="reset" /> Reset
            </button>
          </div>
        </div>
        <div className="dr-panel">
          <h2>Dressing room</h2>
          <p className="dr-sub">Changes show up in the office right away, and stay on this computer.</p>
          <Section title="Outfit">{OUTFITS.map((o) => chip('outfit', o, body({ outfit: o }), LABELS[o]))}</Section>
          <Section title="Hair">{HAIR_STYLES.map((h) => chip('hairStyle', h, head({ hairStyle: h, accessory: 'none' }), LABELS[h]))}</Section>
          <Section title="Hair color">
            {HAIR_COLORS.map((c) => chip('hair', c, <i className="dr-swatch" style={{ background: c }} />, `Hair color ${c}`))}
          </Section>
          <Section title="Skin">{SKIN_TONES.map((c) => chip('skin', c, <i className="dr-swatch" style={{ background: c }} />, `Skin tone ${c}`))}</Section>
          <Section title="Extras">{ACCESSORIES.map((a) => chip('accessory', a, a === 'tie' ? body({ accessory: a }) : head({ accessory: a }), LABELS[a]))}</Section>
          <Section title="Desk item">{DESK_ITEMS.map((d) => chip('deskItem', d, <span className="dr-word">{LABELS[d]}</span>, LABELS[d]))}</Section>
        </div>
      </div>
    </Modal>
  );
}
