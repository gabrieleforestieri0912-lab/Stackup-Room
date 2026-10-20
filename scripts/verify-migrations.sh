#!/usr/bin/env bash
# Verifica end-to-end delle migrazioni Supabase + RLS su Postgres locale (Docker).
#
#   ./scripts/verify-migrations.sh
#
# Applica 002 -> 014 in ordine su un Postgres 16 containerizzato con uno stub
# di auth/storage, poi verifica che due utenti non possano vedere i dati
# l'uno dell'altro. Esce con codice 1 al primo errore.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG="${PG_CONTAINER:-stackup-pg}"
PORT="${PG_PORT:-55432}"
IMAGE="${PG_IMAGE:-postgres:16-alpine}"

command -v docker >/dev/null || { echo "docker non disponibile: impossibile verificare le migrazioni"; exit 1; }
docker info >/dev/null 2>&1 || { echo "docker daemon non in esecuzione: impossibile verificare le migrazioni"; exit 1; }

cleanup() { docker rm -f "$PG" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run -d --name "$PG" -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stackup \
  -p "$PORT":5432 "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  docker exec "$PG" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

docker cp "$ROOT/scripts/supabase-stub.sql" "$PG":/stub.sql >/dev/null
docker exec "$PG" psql -U postgres -d stackup -v ON_ERROR_STOP=1 -f /stub.sql >/dev/null

for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  docker cp "$f" "$PG":/m.sql >/dev/null
  if ! docker exec "$PG" psql -U postgres -d stackup -v ON_ERROR_STOP=1 -f /m.sql >/tmp/verify-migrations.log 2>&1; then
    echo "MIGRATION FAIL: $f"
    tail -20 /tmp/verify-migrations.log
    exit 1
  fi
  echo "migration OK: $(basename "$f")"
done

docker cp "$ROOT/scripts/rls-check.sql" "$PG":/rls.sql >/dev/null
docker exec "$PG" psql -U postgres -d stackup -v ON_ERROR_STOP=1 -f /rls.sql
