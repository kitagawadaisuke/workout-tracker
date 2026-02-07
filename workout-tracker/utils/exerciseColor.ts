const fixedExerciseColors: Record<string, string> = {
  // ids
  pushup: '#3B82F6',
  squat: '#F97316',
  pullup: '#22C55E',
  bodypump: '#A855F7',
  bodycombat: '#EF4444',
  leapfight: '#14B8A6',
  // names (legacy/visible)
  '腕立て伏せ': '#3B82F6',
  'スクワット': '#F97316',
  '懸垂': '#22C55E',
  'ボディパンプ': '#A855F7',
  'ボディコンバット': '#EF4444',
  'リープファイト': '#14B8A6',
  'プッシュアップ': '#3B82F6',
};

const huePalette = [210, 30, 120, 280, 0, 170, 60, 330, 200, 20, 140, 300];

export const getExerciseColor = (key: string): string => {
  const fixed = fixedExerciseColors[key];
  if (fixed) return fixed;

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const hue = huePalette[Math.abs(hash) % huePalette.length];
  const saturation = 72;
  const lightness = 55 + (Math.abs(hash >> 3) % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
