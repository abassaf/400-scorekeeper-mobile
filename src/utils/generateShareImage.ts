import { Skia, ImageFormat, PaintStyle } from '@shopify/react-native-skia';
import type { SkCanvas, SkFont } from '@shopify/react-native-skia';
import {
  cacheDirectory,
  makeDirectoryAsync,
  deleteAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { runningTotals, playerStats, playerCumulativeScore } from '../scoring';
import { colors } from '../theme';
import type { GameState, PlayerIndex } from '../types';

// Canvas dimensions (2× the 340px reference card)
const W = 680;
const PAD = 32;
const GAP = 24;
const INNER = W - PAD * 2; // 616

// Font sizes
const SZ_TINY = 18;
const SZ_SM = 20;
const SZ_MD = 22;
const SZ_BASE = 28;
const SZ_LG = 32;
const SZ_HUGE = 64;

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

function scoreColor(score: number) {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}

function fmtDelta(score: number) {
  return score > 0 ? `+${score}` : `${score}`;
}

// ──────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────

export async function generateShareImage(state: GameState): Promise<string> {
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
  const HEADER_H = 56;
  const TEAM_BOX_H = 210;
  const HISTORY_ROW_H = 24;
  const HISTORY_PANEL_PAD = 20;
  const HISTORY_HEADER_H = 32;
  const HISTORY_H =
    rounds.length > 0
      ? HISTORY_PANEL_PAD + HISTORY_HEADER_H + rounds.length * HISTORY_ROW_H + HISTORY_PANEL_PAD
      : 0;
  const STATS_H = rounds.length > 0 ? 180 : 0;
  const FOOTER_H = 48;

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

  // Load system typeface via FontMgr so drawText calls actually render
  const typeface = Skia.FontMgr.System().matchFamilyStyle('', {});
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
  const labelW = fMd.measureText(roundLabel).width;
  drawText(canvas, roundLabel, W - PAD - labelW, headerBaseline - 4, colors.textMuted, fMd);

  y += HEADER_H + GAP;

  // ── Team score boxes ─────────────────────────────
  const BOX_W = (INNER - GAP) / 2;

  for (let t = 0; t < 2; t++) {
    const bx = PAD + t * (BOX_W + GAP);
    const by = y;
    const isWinner = winner === (t === 0 ? 'A' : 'B');
    const total = t === 0 ? totals.a : totals.b;
    const p1 = t === 0 ? players[0] : players[2];
    const p2 = t === 0 ? players[1] : players[3];
    const teamLabel = `Team ${t === 0 ? 'A' : 'B'}`;

    canvas.drawRRect(rrect(bx, by, BOX_W, TEAM_BOX_H, 24), mkFill(colors.card));
    canvas.drawRRect(rrect(bx, by, BOX_W, TEAM_BOX_H, 24), mkStroke(isWinner ? colors.accent : colors.border, 2));

    const ipx = bx + 20;
    let ty = by + Math.round(SZ_TINY * 0.82) + 16;

    drawText(canvas, teamLabel, ipx, ty, colors.textSubtle, fTiny);
    ty += SZ_TINY + 8;

    const names = `${p1} & ${p2}`;
    drawText(canvas, names, ipx, ty, colors.textSecondary, fMd);
    ty += SZ_MD + 16;

    drawText(canvas, `${total}`, ipx, ty, colors.textPrimary, fHuge);
    ty += 16;

    const trackW = BOX_W - 40;
    const trackH = 14;
    canvas.drawRRect(rrect(ipx, ty, trackW, trackH, 7), mkFill(colors.border));
    const pct = Math.min(Math.max(total / scoreLimit, 0), 1);
    if (pct > 0) {
      canvas.drawRRect(rrect(ipx, ty, Math.round(trackW * pct), trackH, 7), mkFill(colors.accent));
    }
    ty += trackH + 12;

    const limitText = `/ ${scoreLimit}`;
    const limitTextW = fTiny.measureText(limitText).width;
    drawText(canvas, limitText, bx + BOX_W - 20 - limitTextW, ty, colors.textSubtle, fTiny);
  }

  y += TEAM_BOX_H + GAP;

  // ── Round history ────────────────────────────────
  if (rounds.length > 0) {
    canvas.drawRRect(rrect(PAD, y, INNER, HISTORY_H, 16), mkFill(colors.card));
    canvas.drawRRect(rrect(PAD, y, INNER, HISTORY_H, 16), mkStroke(colors.border, 2));

    const COL_NUM = 36;
    const COL_DELTA = 50;
    const COL_CUM = 52;
    const remainW = INNER - 2 * HISTORY_PANEL_PAD - COL_NUM - 2 * COL_DELTA - 2 * COL_CUM;
    const playerColW = Math.floor(remainW / 4);

    let ry = y + HISTORY_PANEL_PAD + Math.round(SZ_TINY * 0.82);

    let rx = PAD + HISTORY_PANEL_PAD;
    drawText(canvas, '#', rx, ry, colors.textSubtle, fTiny);
    rx += COL_NUM;
    for (let i = 0; i < 4; i++) {
      drawText(canvas, players[i].substring(0, 4), rx + i * playerColW, ry, colors.textSubtle, fTiny);
    }
    rx += 4 * playerColW;
    for (const [lbl, colW] of [['AΔ', COL_DELTA], ['BΔ', COL_DELTA], ['AΣ', COL_CUM], ['BΣ', COL_CUM]] as [string, number][]) {
      drawText(canvas, lbl, rx, ry, colors.textSubtle, fTiny);
      rx += colW;
    }

    ry += HISTORY_HEADER_H;

    for (let idx = 0; idx < rounds.length; idx++) {
      const round = rounds[idx];
      const cum = cumulatives[idx];

      if (idx % 2 === 1) {
        canvas.drawRect(
          Skia.XYWHRect(PAD + 1, ry - Math.round(SZ_TINY * 0.82) - 4, INNER - 2, HISTORY_ROW_H),
          mkAlphaFill(colors.border, 0.5),
        );
      }

      let cx = PAD + HISTORY_PANEL_PAD;
      drawText(canvas, `${round.id}`, cx, ry, colors.textMuted, fTiny);
      cx += COL_NUM;

      for (let i = 0; i < 4; i++) {
        const e = round.entries[i as PlayerIndex];
        const made = e.obtained >= e.called;
        drawText(canvas, `${e.called}→${e.obtained}`, cx + i * playerColW, ry, made ? colors.positive : colors.danger, fTiny);
      }
      cx += 4 * playerColW;

      drawText(canvas, fmtDelta(round.teamAScore), cx, ry, scoreColor(round.teamAScore), fTiny); cx += COL_DELTA;
      drawText(canvas, fmtDelta(round.teamBScore), cx, ry, scoreColor(round.teamBScore), fTiny); cx += COL_DELTA;
      drawText(canvas, `${cum.a}`, cx, ry, colors.textPrimary, fTiny); cx += COL_CUM;
      drawText(canvas, `${cum.b}`, cx, ry, colors.textPrimary, fTiny);

      ry += HISTORY_ROW_H;
    }

    y += HISTORY_H + GAP;

    // ── Player stats ─────────────────────────────────
    const CARD_W = Math.floor((INNER - 3 * 12) / 4);
    const CARD_H = STATS_H - 20;

    for (let i = 0; i < 4; i++) {
      const s = stats[i];
      const score = playerCumulativeScore(rounds, i as PlayerIndex);
      const cx = PAD + i * (CARD_W + 12);

      canvas.drawRRect(rrect(cx, y, CARD_W, CARD_H, 16), mkFill(colors.card));
      canvas.drawRRect(rrect(cx, y, CARD_W, CARD_H, 16), mkStroke(colors.border, 2));

      let sy = y + 16 + Math.round(SZ_MD * 0.82);

      const name = players[i].length > 8 ? players[i].substring(0, 7) + '…' : players[i];
      drawText(canvas, name, cx + 14, sy, colors.textPrimary, fMd);
      sy += SZ_MD + 6;

      drawText(canvas, i < 2 ? 'Team A' : 'Team B', cx + 14, sy, colors.textSubtle, fTiny);
      sy += SZ_TINY + 10;

      const scoreStr = `${score >= 0 ? '+' : ''}${score}`;
      drawText(canvas, scoreStr, cx + 14, sy, scoreColor(score), fBase);
      sy += SZ_BASE + 8;

      const makeRateColor =
        s.makeRate >= 0.7 ? colors.positive : s.makeRate >= 0.5 ? colors.warn : colors.danger;
      drawText(canvas, `${Math.round(s.makeRate * 100)}%`, cx + 14, sy, makeRateColor, fSm);
      sy += SZ_SM + 6;

      drawText(canvas, `${s.avgCalled.toFixed(1)} bid`, cx + 14, sy, colors.textMuted, fTiny);
    }

    y += STATS_H;
  }

  // ── Footer ───────────────────────────────────────
  const footerText = '400 Scorekeeper';
  const footerW = fTiny.measureText(footerText).width;
  drawText(canvas, footerText, (W - footerW) / 2, y + GAP + Math.round(SZ_TINY * 0.82), colors.textSubtle, fTiny);

  // ── Encode & write ───────────────────────────────
  const image = surface.makeImageSnapshot();
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
  // Diagnostic — remove after confirming image generation works
  console.warn(`[generateShareImage] canvas ${W}×${H}, base64 length: ${base64.length}`);

  const dir = `${cacheDirectory ?? ''}share-images/`;
  await makeDirectoryAsync(dir, { intermediates: true });
  // Prune any previous exports so the cache doesn't grow unbounded
  await deleteAsync(dir, { idempotent: true });
  await makeDirectoryAsync(dir, { intermediates: true });
  const path = `${dir}score-${Date.now()}.png`;
  await writeAsStringAsync(path, base64, { encoding: EncodingType.Base64 });

  return path;
}
