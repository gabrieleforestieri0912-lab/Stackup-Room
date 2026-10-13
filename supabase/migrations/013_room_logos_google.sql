-- Clearbit ha chiuso il free tier: riscrive i logo vecchi su Google favicons (senza chiave).
UPDATE startups
SET logo_url = 'https://www.google.com/s2/favicons?domain=' || domain || '&sz=128',
    updated_at = NOW()
WHERE logo_url LIKE '%logo.clearbit.com%' AND domain IS NOT NULL;
