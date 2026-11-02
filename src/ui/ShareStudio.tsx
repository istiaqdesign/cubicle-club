import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { toPng } from 'html-to-image';
import { useShallow } from 'zustand/react/shallow';
import { activeAgents, closeShare, openShare, useOffice, type ShareTab } from '../core/store';
import { buildCard, buildComic, buildNews } from '../share/build';
import { Avatar, Icon, Modal } from './bits';
import { Poster, SIZES, buildReport, type Format } from './posters/ShiftReport';
import { TradingCard } from './posters/TradingCard';
import { Newspaper } from './posters/Newspaper';
import { Comic } from './posters/Comic';

// One place for everything you can post: the shift report, trading cards,
// The Daily Agent and the comic of the day. All drawn on device as PNGs.

const TABS: { id: ShareTab; label: string; blurb: string }[] = [
  { id: 'report', label: 'Shift report', blurb: "A poster of today's shift, ready for X, Instagram, TikTok or LinkedIn." },
  { id: 'card', label: 'Trading card', blurb: 'Every agent gets a collectible card. Rarity goes up with their level, and Rare cards and up are shiny.' },
  { id: 'news', label: 'Daily Agent', blurb: "Today's office news as a tiny tabloid front page, written from real stats." },
  { id: 'comic', label: 'Comic', blurb: "A four-panel comic built from what actually happened (and what was said) today." },
];

export function ShareStudio() {
  const tab = useOffice((s) => s.ui.share);
  if (!tab) return null;
  return <Studio tab={tab} />;
}

function Studio({ tab }: { tab: ShareTab }) {
  const team = useOffice(useShallow(activeAgents));
  const agents = useOffice((s) => s.agents);
  const [format, setFormat] = useState<Format>('square');
  const [cardId, setCardId] = useState(() => useOffice.getState().ui.shareAgentId ?? team[0]);
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const agentId = team.includes(cardId) ? cardId : team[0];

  // Content is rebuilt on shuffle, not on every office tick, so it holds still while you look.
  const report = useMemo(buildReport, [seed, tab]);
  const card = useMemo(() => (agentId ? buildCard(agentId) : undefined), [seed, tab, agentId]);
  const news = useMemo(buildNews, [seed, tab]);
  const comic = useMemo(buildComic, [seed, tab]);

  let size = { w: 1080, h: 1350 };
  let poster: ReactNode = null;
  let file = 'cubicle-club';
  let shuffleLabel = 'Shuffle';
  if (tab === 'report') {
    size = SIZES[format];
    poster = <Poster data={report} format={format} />;
    file = `cubicle-club-shift-report-${format}`;
    shuffleLabel = 'Another line of the day';
  } else if (tab === 'card' && card) {
    poster = <TradingCard data={card} />;
    file = `cubicle-club-card-${card.name.toLowerCase()}`;
    shuffleLabel = 'Another special move';
  } else if (tab === 'news') {
    poster = <Newspaper data={news} />;
    file = `the-daily-agent-day-${news.day}`;
    shuffleLabel = 'Stop the presses (new edition)';
  } else if (tab === 'comic') {
    size = { w: 1080, h: 1080 };
    poster = <Comic data={comic} />;
    file = `cubicle-club-comic-day-${comic.day}`;
    shuffleLabel = 'Redraw the comic';
  }

  const scale = Math.min(460 / size.w, 560 / size.h);

  const download = useCallback(async () => {
    if (!exportRef.current) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const url = await toPng(exportRef.current, { width: size.w, height: size.h, pixelRatio: 1, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file}.png`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setBusy(false);
    }
  }, [file, size.w, size.h]);

  const info = TABS.find((t) => t.id === tab)!;

  return (
    <Modal onClose={closeShare} className="report-modal share-modal" label="Share studio">
      <nav className="share-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => openShare(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="report-layout">
        <div className="report-preview" style={{ width: size.w * scale, height: size.h * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{poster}</div>
        </div>
        <div className="report-side">
          <h2>{info.label}</h2>
          <p>{info.blurb}</p>
          {tab === 'report' && (
            <div className="seg wide" role="group" aria-label="Size">
              <button className={format === 'square' ? 'on' : ''} onClick={() => setFormat('square')}>
                Square 1080×1080
              </button>
              <button className={format === 'story' ? 'on' : ''} onClick={() => setFormat('story')}>
                Story 1080×1920
              </button>
            </div>
          )}
          {tab === 'card' && (
            <div className="card-picker" role="group" aria-label="Pick an agent">
              {team.map((id) => (
                <button key={id} className={id === agentId ? 'on' : ''} onClick={() => setCardId(id)} aria-pressed={id === agentId} title={agents[id].info.name}>
                  <Avatar id={id} role={agents[id].info.role} size={44} />
                  <span>{agents[id].info.name}</span>
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-paper" onClick={() => setSeed((n) => n + 1)}>
            <Icon name="shuffle" /> {shuffleLabel}
          </button>
          <button className="btn btn-primary btn-big" onClick={download} disabled={busy || !poster}>
            <Icon name="download" /> {busy ? 'Printing…' : `Download PNG · ${size.w}×${size.h}`}
          </button>
        </div>
      </div>
      {/* Full-size copy used for the export, kept off-screen. */}
      <div className="export-stage" aria-hidden="true">
        <div ref={exportRef}>{poster}</div>
      </div>
    </Modal>
  );
}
