-- Imbustai website (separate Supabase project) — schema, RLS, triggers

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role) where role = 'admin';

-- -----------------------------------------------------------------------------
-- helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_admin ()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.set_updated_at ()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- New auth users → profile row (role = user only)
create or replace function public.handle_new_user ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- Block self-service role escalation (service_role and admins may change role)
create or replace function public.profiles_guard_role_change ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if auth.role () is distinct from 'service_role' and not public.is_admin () then
      raise exception 'Changing role is not allowed';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row
  execute function public.profiles_guard_role_change ();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- stories
-- -----------------------------------------------------------------------------
create table public.stories (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  title_en text not null,
  title_it text not null,
  description_en text not null,
  description_it text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'eur' check (char_length (currency) = 3),
  is_published boolean not null default false,
  first_letter text not null default '',
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index stories_published_idx on public.stories (is_published)
  where is_published = true;

create trigger stories_set_updated_at
  before update on public.stories
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- addresses
-- -----------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index addresses_user_id_idx on public.addresses (user_id);

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete restrict,
  story_id uuid not null references public.stories (id) on delete restrict,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'paid', 'cancelled')
  ),
  source text not null check (source in ('stripe', 'admin')),
  shipping_snapshot jsonb not null default '{}'::jsonb,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur' check (char_length (currency) = 3),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- games
-- -----------------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete restrict,
  story_id uuid not null references public.stories (id) on delete restrict,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'completed')
  ),
  questionnaire jsonb,
  feedback text,
  created_at timestamptz not null default now (),
  completed_at timestamptz
);

create index games_user_id_idx on public.games (user_id);
create index games_status_idx on public.games (status);

-- -----------------------------------------------------------------------------
-- interactions
-- -----------------------------------------------------------------------------
create table public.interactions (
  id uuid primary key default gen_random_uuid (),
  game_id uuid not null references public.games (id) on delete cascade,
  role text not null check (role in ('ai', 'user')),
  content text not null,
  letter_number integer not null check (letter_number > 0),
  visible_from timestamptz,
  created_at timestamptz not null default now ()
);

create index interactions_game_id_idx on public.interactions (game_id);

-- -----------------------------------------------------------------------------
-- Stripe webhook idempotency
-- -----------------------------------------------------------------------------
create table public.stripe_events (
  id text primary key,
  processed_at timestamptz not null default now ()
);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.games enable row level security;
alter table public.interactions enable row level security;
alter table public.stripe_events enable row level security;

-- profiles
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid () or public.is_admin ());

create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid ())
  with check (id = auth.uid ());

create policy profiles_update_admin_any on public.profiles
  for update
  using (public.is_admin ());

-- stories
create policy stories_select_published_or_admin on public.stories
  for select using (is_published = true or public.is_admin ());

create policy stories_write_admin on public.stories
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

-- addresses
create policy addresses_crud_own on public.addresses
  for all
  using (user_id = auth.uid ())
  with check (user_id = auth.uid ());

create policy addresses_select_admin on public.addresses
  for select using (public.is_admin ());

-- orders: users read own; no insert/update/delete for authenticated (service_role only)
create policy orders_select_own_or_admin on public.orders
  for select using (user_id = auth.uid () or public.is_admin ());

-- games
create policy games_select_own_or_admin on public.games
  for select using (user_id = auth.uid () or public.is_admin ());

-- interactions: visible if game belongs to user or admin
create policy interactions_select_via_game on public.interactions
  for select using (
    exists (
      select 1
      from public.games g
      where g.id = interactions.game_id
        and (g.user_id = auth.uid () or public.is_admin ())
    )
  );

-- stripe_events: RLS on, no policies — only service_role (bypasses RLS) used from webhooks
