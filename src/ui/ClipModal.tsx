import { closeClip, makeVideo, startClip, stopClip, useClip } from '../share/clipStore';
import { download, videoSupported } from '../share/clip';
import { Icon, Modal } from './bits';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const secs = (s: number) => `0:${String(Math.min(59, Math.floor(s))).padStart(2, '0')}`;

/** Red "REC" badge on the office while a clip is being captured. */
export function RecordingBadge() {
  const phase = useClip((s) => s.phase);
  const elapsed = useClip((s) => s.elapsed);
  const seconds = useClip((s) => s.seconds);
  if (phase !== 'recording') return null;
  return (
    <div className="rec-frame">
      <div className="rec-badge">
        <i className="rec-dot" />
        REC {secs(elapsed)} / {secs(seconds)}
        <button className="rec-stop" onClick={stopClip}>
          Stop
        </button>
      </div>
      <div className="rec-bar">
        <i style={{ width: `${Math.min(100, (elapsed / seconds) * 100)}%` }} />
      </div>
    </div>
  );
}

export function ClipModal() {
  const s = useClip();
  if (s.phase === 'idle' || s.phase === 'recording') return null;

  return (
    <Modal onClose={closeClip} className="clip-modal" label="Your clip">
      {s.phase === 'developing' && (
        <div className="clip-developing">
          <div className="film-reel" aria-hidden="true">
            <Icon name="film" size={44} />
          </div>
          <h2>Developing your clip…</h2>
          <p>Every frame is drawn right here on your computer. Nothing is uploaded.</p>
          <div className="clip-progress">
            <i style={{ width: `${Math.round(s.progress * 100)}%` }} />
          </div>
        </div>
      )}

      {s.phase === 'error' && (
        <div className="clip-developing">
          <h2>Oops, the film jammed</h2>
          <p>{s.error}</p>
          <button className="btn btn-primary" onClick={() => startClip(6)}>
            <Icon name="record" /> Try a 6 second clip
          </button>
        </div>
      )}

      {s.phase === 'ready' && s.gif && s.gifUrl && (
        <div className="report-layout">
          <div className="clip-preview">
            <img src={s.gifUrl} alt="Your recorded office clip" />
          </div>
          <div className="report-side">
            <h2>Your clip</h2>
            <p>
              {s.seconds} seconds of office life with a small “Made with Cubicle Club” sticker. GIFs loop nicely on X, Slack and Discord. For Instagram, TikTok and
              LinkedIn, grab the video.
            </p>
            <button className="btn btn-primary btn-big" onClick={() => download(s.gif!, 'cubicle-club-clip.gif')}>
              <Icon name="download" /> Download GIF <small className="btn-meta">{mb(s.gif.size)}</small>
            </button>
            {videoSupported() &&
              (s.video ? (
                <button className="btn btn-good btn-big" onClick={() => download(s.video!.blob, `cubicle-club-clip.${s.video!.ext}`)}>
                  <Icon name="download" /> Download video <small className="btn-meta">{s.video.ext.toUpperCase()} · {mb(s.video.blob.size)}</small>
                </button>
              ) : (
                <button className="btn btn-paper btn-big" onClick={makeVideo} disabled={s.videoProgress != null}>
                  <Icon name="film" />
                  {s.videoProgress != null ? `Making video… ${Math.round(s.videoProgress * 100)}%` : 'Make a video version (HD)'}
                </button>
              ))}
            {s.error && <p className="clip-note">{s.error}</p>}
            <button className="btn btn-paper" onClick={() => startClip(s.seconds)}>
              <Icon name="record" /> Record another
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
