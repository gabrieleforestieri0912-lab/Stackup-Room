-- Avatar pubblici: il bucket `avatars` era privato e mai usato.
-- Le immagini profilo vengono caricate via service-role e servite con URL pubblici,
-- quindi rendiamo il bucket pubblico (idempotente).
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;
