export const darkColors = {
  bg: '#09090b',
  card: '#212127',
  border: '#52525b',
  borderMuted: '#3f3f46',
  textPrimary: '#ffffff',
  textSecondary: '#d4d4d8',
  textMuted: '#a1a1aa',
  textSubtle: '#52525b',
  accent: '#10b981',
  accentHover: '#059669',
  accentText: '#000000',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,0.1)',
  warn: '#facc15',
  positive: '#34d399',
  buttonPrimary: '#ffffff',
  buttonPrimaryText: '#09090b',
  progressTrack: 'rgba(39,39,42,0.6)',
  tableRowAlt: 'rgba(255,255,255,0.04)',
  teamA: {
    bg:     'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    text:   '#93c5fd',
    solid:  '#3b82f6',
  },
  teamB: {
    bg:     'rgba(244,63,94,0.12)',
    border: 'rgba(244,63,94,0.35)',
    text:   '#fda4af',
    solid:  '#f43f5e',
  },
};

export const lightColors = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#cbd5e1',
  borderMuted: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  accent: '#059669',
  accentHover: '#047857',
  accentText: '#000000',
  danger: '#dc2626',
  dangerBg: 'rgba(220,38,38,0.10)',
  warn: '#ca8a04',
  positive: '#16a34a',
  buttonPrimary: '#0f172a',
  buttonPrimaryText: '#ffffff',
  progressTrack: '#e2e8f0',
  tableRowAlt: 'rgba(15,23,42,0.04)',
  teamA: {
    bg:     'rgba(37,99,235,0.10)',
    border: 'rgba(37,99,235,0.32)',
    text:   '#1d4ed8',
    solid:  '#2563eb',
  },
  teamB: {
    bg:     'rgba(225,29,72,0.10)',
    border: 'rgba(225,29,72,0.32)',
    text:   '#be123c',
    solid:  '#e11d48',
  },
};

export type ThemeColors = typeof darkColors;

// Temporary compatibility shim — remove after all consumers migrated to useTheme()
export const colors = darkColors;
