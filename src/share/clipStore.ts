import { create } from 'zustand';
import { record, toGif, toVideo, type Recording } from './clip';

// The clip recorder's state: recording → developing → ready.

export type ClipPhase = 'idle' | 'recording' | 'developing' | 'ready' | 'error';

interface ClipState {
  phase: ClipPhase;
  seconds: number;
  elapsed: number;
  progress: number;
  gif?: Blob;
  gifUrl?: string;
  video?: { blob: Blob; ext: string; url: string };
  videoProgress?: number;
  error?: string;
}

export const useClip = create<ClipState>(() => ({ phase: 'idle', seconds: 6, elapsed: 0, progress: 0 }));

const FPS = 10;
let recording: Recording | null = null;
let abort: AbortController | null = null;

function release() {
  const s = useClip.getState();
  if (s.gifUrl) URL.revokeObjectURL(s.gifUrl);
  if (s.video) URL.revokeObjectURL(s.video.url);
}

export async function startClip(seconds: number) {
  if (useClip.getState().phase === 'recording' || useClip.getState().phase === 'developing') return;
  release();
  recording = null;
  abort = new AbortController();
  useClip.setState({ phase: 'recording', seconds, elapsed: 0, progress: 0, gif: undefined, gifUrl: undefined, video: undefined, videoProgress: undefined, error: undefined });
  try {
    recording = await record(seconds, FPS, (elapsed) => useClip.setState({ elapsed }), abort.signal);
    // Stopped almost straight away: nothing worth keeping.
    if (recording.frames.length < FPS) {
      useClip.setState({ phase: 'idle' });
      return;
    }
    useClip.setState({ phase: 'developing', progress: 0 });
    const gif = await toGif(recording, (progress) => useClip.setState({ progress }));
    useClip.setState({ phase: 'ready', gif, gifUrl: URL.createObjectURL(gif) });
  } catch (err) {
    console.error('Clip failed', err);
    useClip.setState({ phase: 'error', error: 'Something went wrong while making the clip. Try a shorter one?' });
  }
}

/** Stop early and keep what was recorded so far. */
export const stopClip = () => abort?.abort();

export async function makeVideo() {
  const s = useClip.getState();
  if (!recording || s.video || s.videoProgress != null) return;
  useClip.setState({ videoProgress: 0 });
  try {
    const { blob, ext } = await toVideo(recording, (videoProgress) => useClip.setState({ videoProgress }));
    useClip.setState({ video: { blob, ext, url: URL.createObjectURL(blob) }, videoProgress: undefined });
  } catch (err) {
    console.error('Video failed', err);
    useClip.setState({ videoProgress: undefined, error: 'Your browser could not make a video. The GIF still works.' });
  }
}

export function closeClip() {
  if (useClip.getState().phase === 'recording') return;
  release();
  recording = null;
  useClip.setState({ phase: 'idle', gif: undefined, gifUrl: undefined, video: undefined, videoProgress: undefined, error: undefined });
}
