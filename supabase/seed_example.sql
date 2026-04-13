-- Example: publish one story after migrations (run in SQL editor or psql).
-- Replace slug/titles/prices as needed.

/*
insert into public.stories (
  slug,
  title_en,
  title_it,
  description_en,
  description_it,
  price_cents,
  currency,
  is_published,
  first_letter
) values (
  'first-light',
  'First Light',
  'Prima luce',
  'A slow correspondence begins at your mailbox.',
  'Una lenta corrispondenza inizia nella tua cassetta.',
  4999,
  'eur',
  true,
  'Dear reader, this is where your story begins…'
);
*/

-- Promote your user to admin (replace UUID with auth.users.id):
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
