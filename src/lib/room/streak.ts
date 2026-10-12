// Calcolo streak da giorni shippati (funzione pura: testabile senza DB).
export function computeStreak(days: string[], todayIso?: string): { current: number; longest: number; todayDone: boolean } {
  const today = todayIso || new Date().toISOString().slice(0, 10);
  const set = new Set(days);
  const todayDone = set.has(today);

  // Serie corrente: parte da oggi (se shippato) o da ieri
  let current = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Serie più lunga
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev) {
      const diff = (new Date(`${d}T00:00:00Z`).getTime() - new Date(`${prev}T00:00:00Z`).getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest, todayDone };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
