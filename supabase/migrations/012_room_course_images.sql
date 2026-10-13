-- Ogni corso ha la sua immagine reale in /corsi/*.png: nessun placeholder.
-- Ripara righe legacy senza immagine o con placeholder generico.
UPDATE courses SET image_url = '/corsi/landing.png' WHERE slug = 'landing-page-design' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
UPDATE courses SET image_url = '/corsi/next-saas.png' WHERE slug = 'nextjs-saas' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
UPDATE courses SET image_url = '/corsi/go.png' WHERE slug = 'go-backend' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
UPDATE courses SET image_url = '/corsi/docker.png' WHERE slug = 'docker-devops' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
UPDATE courses SET image_url = '/corsi/sql.png' WHERE slug = 'sql-database' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
UPDATE courses SET image_url = '/corsi/git.png' WHERE slug = 'git-github' AND (image_url IS NULL OR image_url LIKE '%placeholder%');
