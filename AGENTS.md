# Stackup Room — istruzioni per gli agenti

## Regola d'oro

Non dichiarare "fatto" senza aver **eseguito** la verifica e letto l'output.
Vedi la regola globale in `~/.config/opencode/AGENTS.md`: la risposta finale
deve elencare i comandi eseguiti e il loro esito reale.

## Comandi di verifica (web)

```bash
npm ci            # dipendenze (una volta)
npm run verify    # lint + typecheck + test + build di produzione
```

Scomposizione:

| Comando           | Cosa verifica                                  |
| ----------------- | ---------------------------------------------- |
| `npm run lint`    | ESLint (deve uscire 0 errori **e** 0 warning)  |
| `npm run typecheck` | `tsc --noEmit`, nessun errore di tipo         |
| `npm test`        | Vitest: `src/lib/room/__tests__/` + `src/app/**/__tests__/` (test di componente con jsdom) |
| `npm run build`   | build Next.js di produzione                    |

Per la build servono le env: copia `.env.example` in `.env.local` con valori
di test (non committare).

## Comandi di verifica (mobile Flutter)

```bash
npm run verify:mobile   # flutter analyze + flutter test (mobile/)
```

Richiede il Flutter SDK installato (stable). Senza SDK: dichiarare
esplicitamente "mobile non testato", non "fatto".

## Smoke test del server

```bash
npm run build && npm run start   # http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Pagine pubbliche attese in 200: `/`, `/welcome`, `/courses`, `/paths`,
`/resources`, `/guide`, `/login`, `/register`, `/llms.txt`, `/robots.txt`,
`/sitemap.xml`. `/room` deve rispondere 307 (redirect). Un percorso inesistente
deve dare 404.

## Schema database e RLS

Le migrazioni stanno in `supabase/migrations/`. Per verificarle senza Supabase
Cloud si usa Postgres in Docker con uno stub di `auth`/`storage`:

```bash
npm run verify:db    # applica 002 -> 014 e controlla l'isolamento RLS
```

Lo script è `scripts/verify-migrations.sh` (richiede Docker attivo). Fallisce
con exit code 1 se una migrazione non applica o se un utente vede i dati
dell'altro.
