import { useEffect, type ReactNode } from 'react';
import type { RoleId } from '../core/types';
import { achievementById, type PinGlyph } from '../core/progression';
import { ROLES, useLook } from '../content/roster';
import { AgentSprite } from '../scene/AgentSprite';

// Small shared UI pieces: icons, logo, avatar sticker, enamel pin, modal.

const ICONS: Record<string, ReactNode> = {
  board: <path d="M4 5h16v11H4z M8 20l4-4 4 4 M8 9h3 M8 12h5 M14 9h2" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />,
  sound: <path d="M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12" />,
  mute: <path d="M4 9h4l5-4v14l-5-4H4z M16 9l5 6 M21 9l-5 6" />,
  focus: <path d="M12 4c-4 4-6 7-6 10a6 6 0 0 0 12 0c0-3-2-6-6-10z M12 20v-6" />,
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
  close: <path d="M6 6l12 12 M18 6L6 18" />,
  download: <path d="M12 4v11 M7 10l5 5 5-5 M5 20h14" />,
  shuffle: <path d="M4 7h4l8 10h4 M4 17h4l2-2.5 M14 9.5L16 7h4 M18 5l2 2-2 2 M18 15l2 2-2 2" />,
  record: <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  film: <path d="M4 5h16v14H4z M8 5v14 M16 5v14 M4 9h4 M4 15h4 M16 9h4 M16 15h4" />,
  share: <path d="M12 15V4 M8 8l4-4 4 4 M6 12v7h12v-7" />,
  shirt: <path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z" />,
  paw: <path d="M12 20c-3 0-5-1.6-5-3.6 0-2.4 2.4-4.9 5-4.9s5 2.5 5 4.9c0 2-2 3.6-5 3.6z M6 10.5a1.8 2.2 0 1 0 0-.1 M18 10.5a1.8 2.2 0 1 0 0-.1 M9.5 6.5a1.8 2.2 0 1 0 0-.1 M14.5 6.5a1.8 2.2 0 1 0 0-.1" />,
  dice: <path d="M5 5h14v14H5z M9 9h.01 M15 9h.01 M12 12h.01 M9 15h.01 M15 15h.01" />,
  reset: <path d="M5 12a7 7 0 1 0 2-5 M5 4v4h4" />,
};

export function Icon({ name, size = 18 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#FF8A3D" />
      <rect x="14" y="16" width="36" height="26" rx="7" fill="#FFF6EA" />
      <circle cx="26" cy="28" r="3" fill="#3A2E2A" />
      <circle cx="38" cy="28" r="3" fill="#3A2E2A" />
      <path d="M27 34 Q32 38 37 34" stroke="#3A2E2A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="26" y="42" width="12" height="5" fill="#FFF6EA" />
      <rect x="20" y="46" width="24" height="5" rx="2.5" fill="#FFF6EA" />
    </svg>
  );
}

export function Avatar({ id, role, size = 36 }: { id: string; role: RoleId; size?: number }) {
  const look = useLook(id);
  return (
    <span className="avatar" style={{ width: size, height: size, background: ROLES[role].color }}>
      <AgentSprite look={look} role={role} headOnly expression="neutral" />
    </span>
  );
}

const GLYPHS: Record<PinGlyph, string> = {
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z',
  moon: 'M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5z',
  shield: 'M12 3l7.5 3v5.5c0 4.7-3.2 8-7.5 9.5-4.3-1.5-7.5-4.8-7.5-9.5V6z',
  bolt: 'M13.5 2.5L5.5 13.5h6L10.5 21.5l8-11h-6z',
  heart: 'M12 20s-8-5.2-8-11a4.3 4.3 0 0 1 8-2.3A4.3 4.3 0 0 1 20 9c0 5.8-8 11-8 11z',
  flame: 'M12 2.5s5.5 4.6 5.5 10.2A5.5 5.5 0 0 1 12 21.5a5.5 5.5 0 0 1-5.5-5.5c0-2.6 1.6-4.3 2.6-5.3.2 1.6 1 2.7 2.2 3.1C11 10 12 6 12 2.5z',
};

/** An achievement as an enamel pin. */
export function Pin({ id, size = 40, title }: { id: string; size?: number; title?: boolean }) {
  const a = achievementById[id];
  if (!a) return null;
  return (
    <span className="pin" title={title ? `${a.name}: ${a.blurb}` : undefined} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
        <circle cx="20" cy="21" r="18" fill="#000" opacity="0.15" />
        <circle cx="20" cy="19" r="18" fill="#FFE7A8" stroke="#D9A23A" strokeWidth="2" />
        <circle cx="20" cy="19" r="13.5" fill={a.color} />
        <g transform="translate(8 7)">
          <path d={GLYPHS[a.glyph]} fill="#fff" />
        </g>
        <path d="M9 12 Q13 6 20 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.6" />
      </svg>
    </span>
  );
}

export function Modal({ onClose, className, children, label }: { onClose: () => void; className?: string; children: ReactNode; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${className ?? ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-close btn-icon" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>
  );
}
