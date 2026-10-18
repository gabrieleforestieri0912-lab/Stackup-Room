// Conteggi giornalieri reali: prima il calendario ufficiale GitHub (GraphQL
// contributionCollection, stesso grafico del profilo), poi gli eventi pubblici come fallback.
export async function fetchPublicCounts(username: string): Promise<Map<string, number>> {
  try {
    return await fetchCalendarCounts(username);
  } catch {
    return fetchEventCounts(username);
  }
}

type GhGraphQlDay = { date: string; contributionCount: number };

// Grafico contribuzioni ufficiale: copre 365 giorni con tutti i tipi di contributo.
async function fetchCalendarCounts(username: string): Promise<Map<string, number>> {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN assente');
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 364);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const query = `query($login:String!,$from:Date!,$to:Date!){ user(login:$login){ contributionCollection(from:$from,to:$to){ contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: ghHeaders(),
    body: JSON.stringify({ query, variables: { login: username, from: fmt(from), to: fmt(to) } }),
  });
  if (res.status === 404) throw new Error('Utente GitHub non trovato');
  if (!res.ok) throw new Error('GitHub non raggiungibile');
  const json = (await res.json()) as { data?: { user?: { contributionCollection?: { contributionCalendar?: { weeks?: Array<{ contributionDays?: GhGraphQlDay[] }> } } } }; errors?: unknown[] };
  if (json.errors?.length) throw new Error('GraphQL: contribuzioni non disponibili');
  const weeks = json.data?.user?.contributionCollection?.contributionCalendar?.weeks;
  if (!weeks) throw new Error('Utente GitHub non trovato');
  const counts = new Map<string, number>();
  for (const w of weeks) {
    for (const d of w.contributionDays || []) {
      counts.set(d.date, d.contributionCount);
    }
  }
  return counts;
}

// Fallback senza token: eventi pubblici (copertura ~90 giorni).
async function fetchEventCounts(username: string): Promise<Map<string, number>> {
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

export type GithubRepoPreview = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
};

export type GithubProfilePreview = {
  profile: {
    login: string;
    name: string | null;
    bio: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  repos: GithubRepoPreview[];
};

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'stackup-room' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

// Anteprima pubblica da username: profilo + repo aggiornati di recente. Solo lettura.
export async function fetchGithubProfile(username: string): Promise<GithubProfilePreview> {
  const u = encodeURIComponent(username);
  const [pRes, rRes] = await Promise.all([
    fetch(`https://api.github.com/users/${u}`, { headers: ghHeaders() }),
    fetch(`https://api.github.com/users/${u}/repos?per_page=6&sort=updated`, { headers: ghHeaders() }),
  ]);
  if (pRes.status === 404) throw new Error('Utente GitHub non trovato');
  if (!pRes.ok) throw new Error('GitHub non raggiungibile, riprova più tardi');
  const p = (await pRes.json()) as Record<string, unknown>;
  const repos = rRes.ok ? ((await rRes.json()) as Array<Record<string, unknown>>) : [];
  return {
    profile: {
      login: String(p.login || username),
      name: (p.name as string) || null,
      bio: (p.bio as string) || null,
      avatar_url: String(p.avatar_url || ''),
      html_url: String(p.html_url || `https://github.com/${u}`),
      public_repos: Number(p.public_repos || 0),
      followers: Number(p.followers || 0),
      following: Number(p.following || 0),
    },
    repos: (Array.isArray(repos) ? repos : []).map((r) => ({
      name: String(r.name || ''),
      html_url: String(r.html_url || ''),
      description: (r.description as string) || null,
      stargazers_count: Number(r.stargazers_count || 0),
      language: (r.language as string) || null,
      updated_at: String(r.updated_at || ''),
    })),
  };
}
