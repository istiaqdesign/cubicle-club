import type { NewsData } from '../../share/build';
import { ROLES, lookFor } from '../../content/roster';
import { AgentSprite } from '../../scene/AgentSprite';
import { LogoMark } from '../bits';

function WeatherIcon({ kind }: { kind: NewsData['weather']['icon'] }) {
  const sun = <circle cx="22" cy="22" r="11" fill="#FFC53D" stroke="#1d1a17" strokeWidth="2.5" />;
  const cloud = (dx = 0) => (
    <path d={`M${14 + dx} 44 a9 9 0 0 1 2 -17 a12 12 0 0 1 23 -2 a9 9 0 0 1 3 19 z`} fill="#fff" stroke="#1d1a17" strokeWidth="2.5" strokeLinejoin="round" />
  );
  return (
    <svg viewBox="0 0 56 60" width="70" height="75" aria-hidden="true">
      {kind !== 'storm' && kind !== 'rain' && sun}
      {kind === 'rain' && <g transform="translate(6 -6)">{sun}</g>}
      {kind !== 'sun' && cloud(kind === 'partly' ? 8 : 2)}
      {kind === 'rain' && <path d="M22 50 l-2 6 M30 50 l-2 6 M38 50 l-2 6" stroke="#52B8FF" strokeWidth="3" strokeLinecap="round" />}
      {kind === 'storm' && <path d="M30 46 l-6 9 h6 l-4 8" fill="none" stroke="#FFC53D" strokeWidth="3.5" strokeLinejoin="round" />}
    </svg>
  );
}

/** "The Daily Agent": a tiny tabloid front page about today's office. 1080×1350. */
export function Newspaper({ data }: { data: NewsData }) {
  return (
    <div className="np-post">
      <div className="np-paper">
        <header className="np-mast">
          <div className="np-ears">
            <span>Vol. 1 · No. {data.day}</span>
            <span>Price: one coffee</span>
          </div>
          <h1>The Daily Agent</h1>
          <div className="np-dateline">
            <span>{data.date}</span>
            <span>All the news that fits in a speech bubble</span>
          </div>
        </header>

        <section className="np-lead">
          <h2>{data.headline}</h2>
          <p className="np-deck">{data.deck}</p>
        </section>

        <div className="np-grid">
          <div className="np-main">
            {data.photo && (
              <figure className="np-photo">
                <div className="np-photo-frame" style={{ background: ROLES[data.photo.role].color }}>
                  <AgentSprite look={lookFor(data.photo.id)} role={data.photo.role} arms="up" expression="joy" prop="trophy" />
                </div>
                <figcaption>{data.photo.caption}</figcaption>
              </figure>
            )}
            <div className="np-quote">
              <span className="np-kicker">Quote of the day</span>
              <p>“{data.quote.text}”</p>
              <small>— {data.quote.by}</small>
            </div>
          </div>

          <aside className="np-side">
            <div className="np-box">
              <span className="np-kicker">Weather</span>
              <div className="np-weather">
                <WeatherIcon kind={data.weather.icon} />
                <p>{data.weather.text}</p>
              </div>
            </div>
            <div className="np-box">
              <span className="np-kicker">Task market</span>
              <ul className="np-market">
                {data.market.map((m) => (
                  <li key={m.id}>
                    <b>{m.name}</b>
                    <span className={m.up ? 'up' : 'down'}>
                      {m.value} {m.up ? '▲' : '▼'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="np-box">
              <span className="np-kicker">Gossip column</span>
              {data.gossip.map((g, i) => (
                <p key={i} className="np-gossip">
                  “{g.text}” <small>— {g.by}</small>
                </p>
              ))}
            </div>
          </aside>
        </div>

        <footer className="np-bottom">
          <div className="np-box np-classified">
            <span className="np-kicker">Classifieds</span>
            {data.classifieds.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
          <div className="np-box np-horo">
            <span className="np-kicker">Horoscope · {data.horoscope.role}s</span>
            <p>{data.horoscope.text}</p>
            <span className="np-kicker np-boss">The Boss's corner</span>
            <p>
              {data.bossStamps ? `You stamped ${data.bossStamps} ${data.bossStamps === 1 ? 'thing' : 'things'} today. The ink pad salutes you.` : 'No stamps today. The ink pad is getting lonely.'}
            </p>
          </div>
        </footer>
        <div className="np-watermark">
          <LogoMark size={28} /> Made with Cubicle Club
        </div>
      </div>
    </div>
  );
}
