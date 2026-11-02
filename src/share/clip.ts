import { getFontEmbedCSS } from 'html-to-image';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { STAGE } from '../scene/layout';

// Records a few seconds of the office, entirely in the browser.
//
// How: several times a second we copy the office scene, freeze every running
// animation at its current frame, and save the copy as a self-contained SVG
// picture. Afterwards the pictures are drawn one by one into a GIF (gifenc) or
// a video (the browser's own MediaRecorder). Nothing leaves the device.

const XHTML = 'http://www.w3.org/1999/xhtml';
const GIF_W = 640;
const GIF_H = 360;

export interface Recording {
  /** CSS and fonts shared by every frame. */
  head: string;
  /** Frozen copies of the stage, one per frame. */
  frames: string[];
  fps: number;
}

let pageCssCache: string | null = null;

/** All of the app's CSS as text, minus font files (those are embedded separately). */
function pageCss() {
  if (pageCssCache) return pageCssCache;
  let css = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule)) css += rule.cssText + '\n';
      }
    } catch {
      /* cross-origin sheet: skip */
    }
  }
  pageCssCache = css;
  return css;
}

// Anything not caught below (finished one-shot animations) rests at its end state.
const FREEZE = '*,*::before,*::after{animation-play-state:paused!important;animation-delay:-600s!important;transition:none!important}';

const num = (t: CSSNumberish | null | undefined) => (t == null ? 0 : Number(t));

/** One frozen copy of the stage, as markup. */
function snapshot(stage: HTMLElement, wrapClass: string) {
  const clone = stage.cloneNode(true) as HTMLElement;
  const live = [stage, ...Array.from(stage.querySelectorAll('*'))];
  const copy = [clone, ...Array.from(clone.querySelectorAll('*'))];
  const indexOf = new Map(live.map((el, i) => [el, i]));

  // Group running animations by element.
  const keyframed = new Map<Element, Map<string, number>>();
  const transitions = new Map<Element, string[]>();
  for (const anim of stage.getAnimations({ subtree: true })) {
    const target = (anim.effect as KeyframeEffect | null)?.target;
    if (!target) continue;
    if (anim instanceof CSSAnimation) {
      const delay = num(anim.effect?.getTiming().delay as number);
      const offset = delay - num(anim.currentTime);
      if (!keyframed.has(target)) keyframed.set(target, new Map());
      keyframed.get(target)!.set(anim.animationName, offset);
    } else if (anim instanceof CSSTransition) {
      transitions.set(target, [...(transitions.get(target) ?? []), anim.transitionProperty]);
    }
  }

  // Restart each animation in the copy at the exact frame it is showing now.
  for (const [el, offsets] of keyframed) {
    const i = indexOf.get(el);
    const target = i == null ? null : (copy[i] as HTMLElement | SVGElement);
    if (!target) continue;
    const names = getComputedStyle(el).animationName.split(',').map((n) => n.trim());
    target.style.setProperty('animation-delay', names.map((n) => `${offsets.get(n) ?? -600000}ms`).join(','), 'important');
  }
  // Moving things (walking characters) are pinned to where they are mid-move.
  for (const [el, props] of transitions) {
    const i = indexOf.get(el);
    const target = i == null ? null : (copy[i] as HTMLElement | SVGElement);
    if (!target) continue;
    const computed = getComputedStyle(el);
    for (const p of props) target.style.setProperty(p, computed.getPropertyValue(p), 'important');
  }

  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.transform = 'none';

  return (
    `<div xmlns="${XHTML}" class="${wrapClass}" style="position:relative;display:block;min-height:0;width:${STAGE.w}px;height:${STAGE.h}px;overflow:hidden">` +
    new XMLSerializer().serializeToString(clone) +
    `</div>`
  );
}

/** A frame as a self-contained SVG picture. */
function frameUrl(rec: Recording, i: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE.w}" height="${STAGE.h}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">${rec.frames[i].replace('>', () => `>${rec.head}`)}</foreignObject></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function stageEl() {
  const el = document.querySelector<HTMLElement>('.stage');
  if (!el) throw new Error('Office not found');
  return el;
}

/** Captures `seconds` of the office. Resolves with the frozen frames. */
export async function record(seconds: number, fps: number, onTick: (elapsed: number) => void, signal: AbortSignal): Promise<Recording> {
  const stage = stageEl();
  const fonts = await getFontEmbedCSS(stage);
  const head = `<style><![CDATA[${pageCss()}\n${fonts}\n${FREEZE}]]></style>`;
  const wrapClass = (stage.closest('.app')?.className ?? 'app') + ' clip-frame';
  const frames: string[] = [];
  const total = Math.round(seconds * fps);
  const start = performance.now();

  for (let n = 0; n < total; n++) {
    if (signal.aborted) break;
    const due = start + (n * 1000) / fps;
    const wait = due - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    frames.push(snapshot(stage, wrapClass));
    onTick((performance.now() - start) / 1000);
  }
  return { head, frames, fps };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not draw a frame'));
    img.src = src;
  });
}

// --- watermark -----------------------------------------------------------------------

const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="16" fill="#FF8A3D"/><rect x="14" y="16" width="36" height="26" rx="7" fill="#FFF6EA"/><circle cx="26" cy="28" r="3" fill="#3A2E2A"/><circle cx="38" cy="28" r="3" fill="#3A2E2A"/><path d="M27 34 Q32 38 37 34" stroke="#3A2E2A" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="26" y="42" width="12" height="5" fill="#FFF6EA"/><rect x="20" y="46" width="24" height="5" rx="2.5" fill="#FFF6EA"/></svg>';
let logo: Promise<HTMLImageElement> | null = null;

/** Small "Made with Cubicle Club" sticker in the bottom-right corner. */
async function watermark(ctx: CanvasRenderingContext2D, w: number) {
  logo ??= loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO_SVG));
  const img = await logo;
  const s = w / 1280;
  const h = 40 * s;
  const font = `600 ${17 * s}px Fredoka, system-ui, sans-serif`;
  ctx.font = font;
  const text = 'Made with Cubicle Club';
  const pillW = 52 * s + ctx.measureText(text).width;
  const x = w - pillW - 16 * s;
  const y = (w * 9) / 16 - h - 16 * s;
  ctx.fillStyle = 'rgba(255, 253, 248, 0.92)';
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, h, h / 2);
  ctx.fill();
  ctx.drawImage(img, x + 8 * s, y + 6 * s, 28 * s, 28 * s);
  ctx.fillStyle = '#3A2E2A';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 42 * s, y + h / 2 + 1 * s);
}

async function drawFrame(ctx: CanvasRenderingContext2D, src: string, w: number, h: number) {
  const img = await loadImage(src);
  ctx.drawImage(img, 0, 0, w, h);
  await watermark(ctx, w);
}

const nextFrame = () => new Promise((r) => setTimeout(r, 0));

/** Turns a recording into a looping GIF. */
export async function toGif(rec: Recording, onProgress: (p: number) => void): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = GIF_W;
  canvas.height = GIF_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const gif = GIFEncoder();
  const delay = 1000 / rec.fps;

  for (let i = 0; i < rec.frames.length; i++) {
    await drawFrame(ctx, frameUrl(rec, i), GIF_W, GIF_H);
    const { data } = ctx.getImageData(0, 0, GIF_W, GIF_H);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), GIF_W, GIF_H, { palette, delay });
    onProgress((i + 1) / rec.frames.length);
    await nextFrame();
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

const VIDEO_TYPES = ['video/mp4;codecs=avc1.42E01F', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

export const videoSupported = () =>
  typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype && VIDEO_TYPES.some((t) => MediaRecorder.isTypeSupported(t));

/** Plays the recording into the browser's video recorder (takes as long as the clip). */
export async function toVideo(rec: Recording, onProgress: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const type = VIDEO_TYPES.find((t) => MediaRecorder.isTypeSupported(t))!;
  const canvas = document.createElement('canvas');
  canvas.width = STAGE.w;
  canvas.height = STAGE.h;
  const ctx = canvas.getContext('2d')!;
  await drawFrame(ctx, frameUrl(rec, 0), STAGE.w, STAGE.h);

  const stream = canvas.captureStream(rec.fps);
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));
  recorder.start();

  const start = performance.now();
  const frameMs = 1000 / rec.fps;
  // Decode one frame ahead so playback keeps its rhythm.
  let next = loadImage(frameUrl(rec, 0));
  for (let i = 0; i < rec.frames.length; i++) {
    const img = await next;
    if (i + 1 < rec.frames.length) next = loadImage(frameUrl(rec, i + 1));
    const wait = start + i * frameMs - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    ctx.drawImage(img, 0, 0, STAGE.w, STAGE.h);
    await watermark(ctx, STAGE.w);
    onProgress((i + 1) / rec.frames.length);
  }
  await new Promise((r) => setTimeout(r, frameMs));
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  return { blob: new Blob(chunks, { type: type.split(';')[0] }), ext: type.startsWith('video/mp4') ? 'mp4' : 'webm' };
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
