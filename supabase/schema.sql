-- Схема базы Драник-трекера.
-- Выполните этот файл целиком в Supabase: Dashboard → SQL Editor → New query → Run.

create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🙂',
  color text not null default '#f59e0b'
);

create table if not exists commands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🐶',
  category text not null check (category in ('fun', 'useful')),
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists training_logs (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references commands (id) on delete cascade,
  trainer_id uuid references trainers (id) on delete set null,
  location text not null check (location in ('home', 'outside')),
  created_at timestamptz not null default now()
);

create table if not exists potty_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('pad', 'miss', 'asphalt')),
  trainer_id uuid references trainers (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Доступ через anon-ключ без логина. Приложение семейное, ключ публичный —
-- это осознанный компромисс (см. README).
alter table trainers enable row level security;
alter table commands enable row level security;
alter table training_logs enable row level security;
alter table potty_events enable row level security;

create policy "anon full access" on trainers for all using (true) with check (true);
create policy "anon full access" on commands for all using (true) with check (true);
create policy "anon full access" on training_logs for all using (true) with check (true);
create policy "anon full access" on potty_events for all using (true) with check (true);

-- Стартовые данные
insert into trainers (name, emoji, color) values
  ('Валерия', '👩🏻', '#e8739e'),
  ('Партнёр', '🧑🏻', '#5b8fd4');

insert into commands (name, emoji, category, sort_order) values
  ('Сидеть', '🪑', 'useful', 0),
  ('Лежать', '🛋️', 'useful', 1),
  ('Ко мне', '🏃', 'useful', 2),
  ('Рядом', '🚶', 'useful', 3),
  ('Место', '🧺', 'useful', 4),
  ('Ждать', '⏳', 'useful', 5),
  ('Лапа', '🤝', 'fun', 6),
  ('Голос', '📣', 'fun', 7),
  ('Кружись', '🌀', 'fun', 8),
  ('Дай пять', '✋', 'fun', 9);
