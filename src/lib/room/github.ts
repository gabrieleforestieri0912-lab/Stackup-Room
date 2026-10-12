// Conteggi giornalieri da eventi pubblici GitHub (mai accesso al codice).
export async function fetchPublicCounts(username: string): Promise<Map<string, number>> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'stackup-room' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const counts = new Map<string, number>();
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`, { headers });
    if (res.status === 404) throw new Error('Utente GitHub non trovato');
    if (!res.ok) throw new Error('GitHub non raggiungibile, riprova più tardi');
    const events = (await res.json()) as Array<{ type: string; created_at: string; payload?: { commits?: unknown[] } }>;
    if (events.length === 0) break;
    for (const e of events) {
      // Solo eventi di contribuzione: push (per commit), PR, issue, review, create
      let n = 0;
      if (e.type === 'PushEvent') n = Array.isArray(e.payload?.commits) ? e.payload.commits.length : 1;
      else if (['PullRequestEvent', 'IssuesEvent', 'PullRequestReviewEvent', 'CreateEvent'].includes(e.type)) n = 1;
      else continue;
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) || 0) + n);
    }
    if (events.length < 100) break;
  }
  return counts;
}
