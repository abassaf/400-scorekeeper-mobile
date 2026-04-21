import { Skia, ImageFormat, PaintStyle } from '@shopify/react-native-skia';
import type { SkCanvas, SkFont, SkTypeface } from '@shopify/react-native-skia';
import {
  cacheDirectory,
  makeDirectoryAsync,
  deleteAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { runningTotals, playerStats, playerCumulativeScore } from '../scoring';
import type { ThemeColors } from '../theme';
import type { GameState, PlayerIndex } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const INTER_FONT = require('../../assets/fonts/Inter.ttf') as number;

// Canvas dimensions
const W = 1080;
const PAD = 48;
const GAP = 32;
const INNER = W - PAD * 2; // 984

// Font sizes
const SZ_TINY = 18;
const SZ_SM   = 20;
const SZ_MD   = 24;
const SZ_BASE = 30;
const SZ_LG   = 38;
const SZ_HUGE = 76;

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

// ──────────────────────────────────────────────────
// Paint helpers
// ──────────────────────────────────────────────────

function mkFill(hex: string) {
  const p = Skia.Paint();
  p.setColor(Skia.Color(hex));
  p.setAntiAlias(true);
  return p;
}

function mkStroke(hex: string, width = 2) {
  const p = Skia.Paint();
  p.setColor(Skia.Color(hex));
  p.setStyle(PaintStyle.Stroke);
  p.setStrokeWidth(width);
  p.setAntiAlias(true);
  return p;
}

function mkAlphaFill(hex: string, alpha: number) {
  const p = Skia.Paint();
  p.setColor(Skia.Color(hex));
  p.setAlphaf(alpha);
  p.setAntiAlias(true);
  return p;
}

// ──────────────────────────────────────────────────
// Drawing helpers
// ──────────────────────────────────────────────────

function drawText(
  canvas: SkCanvas,
  text: string,
  x: number,
  y: number,
  hex: string,
  font: SkFont,
) {
  canvas.drawText(text, x, y, mkFill(hex), font);
}

function rrect(x: number, y: number, w: number, h: number, r: number) {
  return Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r);
}

function scoreColor(score: number, colors: ThemeColors) {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}

function fmtDelta(score: number) {
  return score > 0 ? `+${score}` : `${score}`;
}

function truncate(name: string, max: number) {
  return name.length > max ? name.substring(0, max - 1) + '…' : name;
}

// ──────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────

// Load the bundled Inter font once and reuse across calls
let _cachedTypeface: SkTypeface | null | undefined;

async function loadTypeface(): Promise<SkTypeface | null> {
  if (_cachedTypeface !== undefined) return _cachedTypeface;
  const [asset] = await Asset.loadAsync(INTER_FONT);
  const uri = asset.localUri ?? asset.uri;
  const data = await Skia.Data.fromURI(uri);
  _cachedTypeface = data ? Skia.Typeface.MakeFreeTypeFaceFromData(data) : null;
  return _cachedTypeface;
}

export async function generateShareImage(state: GameState, colors: ThemeColors): Promise<string> {
  const { players, rounds, scoreLimit, winner } = state;

  const totals = runningTotals(rounds);
  const stats = PLAYER_INDICES.map((i) => playerStats(rounds, i));

  // Cumulative running scores per round
  let runA = 0;
  let runB = 0;
  const cumulatives = rounds.map((r) => {
    runA += r.teamAScore;
    runB += r.teamBScore;
    return { a: runA, b: runB };
  });

  // ── Section heights ──
  const HEADER_H = 64;
  const TEAM_BOX_H = 280;

  // History panel: section label + column headers + data rows
  const HISTORY_PANEL_PAD  = 28;
  const HISTORY_SECTION_H  = 44; // "ROUND HISTORY" label row
  const HISTORY_COL_H      = 36; // column header row
  const HISTORY_ROW_H      = 32; // data row
  const HISTORY_H =
    rounds.length > 0
      ? HISTORY_PANEL_PAD + HISTORY_SECTION_H + HISTORY_COL_H +
        rounds.length * HISTORY_ROW_H + HISTORY_PANEL_PAD
      : 0;

  // Player stats cards — name + team + score (pts) + make% + bid·won
  const STATS_H    = rounds.length > 0 ? 260 : 0;
  const FOOTER_H   = 56;

  const H =
    PAD +
    HEADER_H +
    GAP +
    TEAM_BOX_H +
    (rounds.length > 0 ? GAP + HISTORY_H + GAP + STATS_H : 0) +
    GAP +
    FOOTER_H +
    PAD;

  // ── Create off-screen surface (CPU-backed) ──
  const surface = Skia.Surface.Make(W, H);
  if (!surface) throw new Error('Skia.Surface.Make returned null — Skia not initialized?');
  const canvas = surface.getCanvas();

  // Load bundled Inter typeface — FontMgr.System().matchFamilyStyle returns null on device
  const typeface = await loadTypeface();
  if (!typeface) throw new Error('Failed to load Inter typeface from assets/fonts/Inter.ttf');

  const fTiny = Skia.Font(typeface, SZ_TINY);
  const fSm   = Skia.Font(typeface, SZ_SM);
  const fMd   = Skia.Font(typeface, SZ_MD);
  const fBase = Skia.Font(typeface, SZ_BASE);
  const fLg   = Skia.Font(typeface, SZ_LG);
  const fHuge = Skia.Font(typeface, SZ_HUGE);

  // ── Background ──
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), mkFill(colors.bg));

  let y = PAD;

  // ── Header ──────────────────────────────────────
  const title = '400 Scorekeeper';
  const roundLabel =
    state.phase === 'playing'
      ? `Round ${rounds.length + 1}`
      : `${rounds.length} round${rounds.length !== 1 ? 's' : ''}`;

  const headerBaseline = y + Math.round(SZ_LG * 0.82);
  drawText(canvas, title, PAD, headerBaseline, colors.textPrimary, fLg);
  const labelW = fSm.measureText(roundLabel).width;
  drawText(canvas, roundLabel, W - PAD - labelW, headerBaseline - 2, colors.textMuted, fSm);

  y += HEADER_H + GAP;

  // ── Team score boxes ─────────────────────────────
  const BOX_W  = (INNER - GAP) / 2;
  const TRACK_H = 10;

  for (let t = 0; t < 2; t++) {
    const bx      = PAD + t * (BOX_W + GAP);
    const by      = y;
    const isWinner = winner === (t === 0 ? 'A' : 'B');
    const total   = t === 0 ? totals.a : totals.b;
    const p1      = t === 0 ? players[0] : players[2];
    const p2      = t === 0 ? players[1] : players[3];
    const teamLabel = t === 0 ? 'TEAM A' : 'TEAM B';

    canvas.drawRRect(rrect(bx, by, BOX_W, TEAM_BOX_H, 24), mkFill(colors.card));
    canvas.drawRRect(rrect(bx, by, BOX_W, TEAM_BOX_H, 24), mkStroke(isWinner ? colors.accent : colors.border, 2));

    const ipx = bx + 24;
    const trackW = BOX_W - 48;

    // Top-down flow — advance by ascender before drawing so text doesn't overlap
    // "TEAM A" label
    let ty = by + 24 + Math.round(SZ_TINY * 0.82);
    drawText(canvas, teamLabel, ipx, ty, colors.textSubtle, fTiny);
    ty += SZ_TINY + 10;

    // Player names
    drawText(canvas, `${p1} & ${p2}`, ipx, ty, colors.textSecondary, fMd);
    // Advance far enough to clear the huge score's ascender before drawing it
    ty += Math.round(SZ_HUGE * 0.82) + 12;

    // Big score
    drawText(canvas, `${total}`, ipx, ty, colors.textPrimary, fHuge);
    // Clear descenders then leave a small gap before the track
    ty += Math.round(SZ_HUGE * 0.22) + 16;

    // Progress bar
    canvas.drawRRect(rrect(ipx, ty, trackW, TRACK_H, 5), mkFill(colors.border));
    const pct = Math.min(Math.max(total / scoreLimit, 0), 1);
    if (pct > 0) {
      canvas.drawRRect(rrect(ipx, ty, Math.round(trackW * pct), TRACK_H, 5), mkFill(colors.accent));
    }
    ty += TRACK_H + 12;

    // Score limit — right-aligned
    const limitText = `/ ${scoreLimit}`;
    const limitTextW = fTiny.measureText(limitText).width;
    drawText(canvas, limitText, bx + BOX_W - 24 - limitTextW, ty + Math.round(SZ_TINY * 0.82), colors.textSubtle, fTiny);
  }

  y += TEAM_BOX_H + GAP;

  // ── Round history ────────────────────────────────
  if (rounds.length > 0) {
    canvas.drawRRect(rrect(PAD, y, INNER, HISTORY_H, 20), mkFill(colors.card));
    canvas.drawRRect(rrect(PAD, y, INNER, HISTORY_H, 20), mkStroke(colors.border, 2));

    const hPad = PAD + HISTORY_PANEL_PAD;

    // Section label "ROUND HISTORY"
    let ry = y + HISTORY_PANEL_PAD + Math.round(SZ_TINY * 0.82);
    drawText(canvas, 'ROUND HISTORY', hPad, ry, colors.textSubtle, fTiny);
    ry += HISTORY_SECTION_H;

    // Column layout
    const COL_NUM   = 40;
    const COL_DELTA = 56;
    const COL_CUM   = 60;
    const remainW   = INNER - 2 * HISTORY_PANEL_PAD - COL_NUM - 2 * COL_DELTA - 2 * COL_CUM;
    const playerColW = Math.floor(remainW / 4);

    // Column headers
    let rx = hPad;
    drawText(canvas, '#', rx, ry, colors.textSubtle, fTiny); rx += COL_NUM;
    for (let i = 0; i < 4; i++) {
      drawText(canvas, truncate(players[i], 8), rx + i * playerColW, ry, colors.textSubtle, fTiny);
    }
    rx += 4 * playerColW;
    for (const [lbl, colW] of [
      ['A \u0394', COL_DELTA], ['B \u0394', COL_DELTA],
      ['A \u03A3', COL_CUM],  ['B \u03A3', COL_CUM],
    ] as [string, number][]) {
      drawText(canvas, lbl, rx, ry, colors.textSubtle, fTiny);
      rx += colW;
    }

    ry += HISTORY_COL_H;

    // Data rows
    for (let idx = 0; idx < rounds.length; idx++) {
      const round = rounds[idx];
      const cum = cumulatives[idx];

      if (idx % 2 === 1) {
        canvas.drawRect(
          Skia.XYWHRect(PAD + 1, ry - Math.round(SZ_TINY * 0.82) - 4, INNER - 2, HISTORY_ROW_H),
          mkAlphaFill(colors.border, 0.5),
        );
      }

      let cx = hPad;
      drawText(canvas, `${round.id}`, cx, ry, colors.textMuted, fTiny); cx += COL_NUM;

      for (let i = 0; i < 4; i++) {
        const e = round.entries[i as PlayerIndex];
        const made = e.obtained >= e.called;
        drawText(
          canvas,
          `${e.called}\u2192${e.obtained}`,
          cx + i * playerColW,
          ry,
          made ? colors.positive : colors.danger,
          fTiny,
        );
      }
      cx += 4 * playerColW;

      drawText(canvas, fmtDelta(round.teamAScore), cx, ry, scoreColor(round.teamAScore, colors), fTiny); cx += COL_DELTA;
      drawText(canvas, fmtDelta(round.teamBScore), cx, ry, scoreColor(round.teamBScore, colors), fTiny); cx += COL_DELTA;
      drawText(canvas, `${cum.a}`, cx, ry, colors.textPrimary, fTiny); cx += COL_CUM;
      drawText(canvas, `${cum.b}`, cx, ry, colors.textPrimary, fTiny);

      ry += HISTORY_ROW_H;
    }

    y += HISTORY_H + GAP;

    // ── Player stats ─────────────────────────────────
    const CARD_GAP = 16;
    const CARD_W   = Math.floor((INNER - 3 * CARD_GAP) / 4);
    const CARD_H   = STATS_H - 20;

    for (let i = 0; i < 4; i++) {
      const s     = stats[i];
      const score = playerCumulativeScore(rounds, i as PlayerIndex);
      const cx    = PAD + i * (CARD_W + CARD_GAP);

      canvas.drawRRect(rrect(cx, y, CARD_W, CARD_H, 20), mkFill(colors.card));
      canvas.drawRRect(rrect(cx, y, CARD_W, CARD_H, 20), mkStroke(colors.border, 2));

      let sy = y + 20 + Math.round(SZ_MD * 0.82);

      drawText(canvas, truncate(players[i], 10), cx + 16, sy, colors.textPrimary, fMd);
      sy += SZ_MD + 8;

      drawText(canvas, i < 2 ? 'Team A' : 'Team B', cx + 16, sy, colors.textSubtle, fTiny);
      sy += SZ_TINY + 14;

      const scoreStr = `${score >= 0 ? '+' : ''}${score} pts`;
      drawText(canvas, scoreStr, cx + 16, sy, scoreColor(score, colors), fBase);
      sy += SZ_BASE + 10;

      const makeRateColor =
        s.makeRate >= 0.7 ? colors.positive : s.makeRate >= 0.5 ? colors.warn : colors.danger;
      drawText(canvas, `${Math.round(s.makeRate * 100)}%`, cx + 16, sy, makeRateColor, fSm);
      sy += SZ_SM + 8;

      const bidWon = `${s.avgCalled.toFixed(1)} bid \u00B7 ${s.avgObtained.toFixed(1)} won`;
      drawText(canvas, bidWon, cx + 16, sy, colors.textMuted, fTiny);
    }

    y += STATS_H;
  }

  // ── Footer ───────────────────────────────────────
  const footerText = '400 Scorekeeper';
  const footerW = fTiny.measureText(footerText).width;
  drawText(
    canvas,
    footerText,
    (W - footerW) / 2,
    y + GAP + Math.round(SZ_TINY * 0.82),
    colors.textSubtle,
    fTiny,
  );

  // ── Encode & write ───────────────────────────────
  const image  = surface.makeImageSnapshot();
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);

  const dir = `${cacheDirectory ?? ''}share-images/`;
  await makeDirectoryAsync(dir, { intermediates: true });
  await deleteAsync(dir, { idempotent: true });
  await makeDirectoryAsync(dir, { intermediates: true });
  const path = `${dir}score-${Date.now()}.png`;
  await writeAsStringAsync(path, base64, { encoding: EncodingType.Base64 });

  return path;
}
