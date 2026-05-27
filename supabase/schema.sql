-- =====================================================================
--  MINDLY — SCHEMA COMPLETO PARA SUPABASE
--  Cole TUDO no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
--  e clique em RUN. Pode rodar mais de uma vez com segurança (idempotente).
-- =====================================================================
--  Conteúdo:
--    1. Tabelas (profiles, study_blocks, challenges, user_challenges,
--       rewards, user_rewards, achievements, user_achievements,
--       learning_progress, subject_performance, plans, tickets, revenue)
--    2. Relacionamentos (foreign keys)
--    3. Row Level Security (RLS) + políticas
--    4. Triggers (cria profile no signup, updated_at automático)
--    5. Funções RPC (progresso de desafio, compra de recompensa,
--       estatísticas do admin)
--    6. Seed (dados iniciais: desafios, recompensas, conquistas,
--       planos, receita)
-- =====================================================================

-- Extensões úteis -----------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- =====================================================================
--  1. TABELAS
-- =====================================================================

-- --- PERFIS (1:1 com auth.users) -------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  username    text,
  email       text,
  photo       text,
  bio         text,
  birth       date,
  role        text not null default 'user'  check (role in ('user','admin')),
  status      text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  plan        text not null default 'Grátis',
  coins       integer not null default 90 check (coins >= 0),
  xp          integer not null default 0  check (xp >= 0),
  level       integer not null default 1,
  streak      integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --- BLOCOS DE ESTUDO (Planner) --------------------------------------
create table if not exists public.study_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  time        text not null,                 -- "HH:MM"
  subject     text not null,
  color       text not null default '#3b82f6',
  created_at  timestamptz not null default now()
);
create index if not exists idx_study_blocks_user_date
  on public.study_blocks(user_id, date);

-- --- DESAFIOS (catálogo global) --------------------------------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  icon        text not null default 'star',
  status      text not null default 'Ativo' check (status in ('Ativo','Suspenso')),
  created_at  timestamptz not null default now()
);

-- --- PROGRESSO DO USUÁRIO EM DESAFIOS (N:N) --------------------------
create table if not exists public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id)   on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  progress     integer not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, challenge_id)
);
create index if not exists idx_user_challenges_user on public.user_challenges(user_id);

-- --- RECOMPENSAS (loja) ----------------------------------------------
create table if not exists public.rewards (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text not null default 'Tudo',
  price      integer not null check (price >= 0),
  icon       text not null default 'gift',
  locked     boolean not null default false,
  created_at timestamptz not null default now()
);

-- --- RECOMPENSAS COMPRADAS (N:N) -------------------------------------
create table if not exists public.user_rewards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  reward_id    uuid not null references public.rewards(id)  on delete cascade,
  purchased_at timestamptz not null default now(),
  unique (user_id, reward_id)
);

-- --- CONQUISTAS (catálogo) -------------------------------------------
create table if not exists public.achievements (
  id          serial primary key,
  title       text not null,
  description text,
  reward_coins integer not null default 0,
  required_challenges integer not null default 1
);

-- --- CONQUISTAS DESBLOQUEADAS (N:N) ----------------------------------
create table if not exists public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id)   on delete cascade,
  achievement_id integer not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- --- PROGRESSO DA TRILHA ---------------------------------------------
create table if not exists public.learning_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  step_id      integer not null,
  completed_at timestamptz not null default now(),
  unique (user_id, step_id)
);

-- --- DESEMPENHO POR DISCIPLINA ---------------------------------------
create table if not exists public.subject_performance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  percentage integer not null default 0 check (percentage between 0 and 100),
  unique (user_id, subject)
);

-- --- PLANOS (gerenciados pelo Admin) ---------------------------------
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       text not null,
  description text,
  users_count integer not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- --- TICKETS DE SUPORTE / CONTATO ------------------------------------
create table if not exists public.tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  name       text,
  email      text,
  subject    text not null,
  message    text,
  status     text not null default 'Aberto' check (status in ('Aberto','Respondido')),
  reply      text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

-- --- RECEITA MENSAL (gráfico do dashboard) ---------------------------
create table if not exists public.revenue (
  id         uuid primary key default gen_random_uuid(),
  month      text not null,
  amount     numeric not null default 0,
  sort_order integer not null default 0
);

-- =====================================================================
--  2. TRIGGERS
-- =====================================================================

-- Atualiza updated_at automaticamente em profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria automaticamente um profile quando um usuário se cadastra.
-- O e-mail "vitoraugusto1079@gmail.com" entra como admin (ajuste se quiser).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.email = 'vitoraugusto1079@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  3. FUNÇÕES RPC
-- =====================================================================

-- Soma progresso a um desafio (atômico) e devolve o novo valor.
-- Marca completed_at quando chega a 100.
create or replace function public.increment_challenge_progress(
  p_user_id uuid, p_challenge_id uuid, p_amount integer
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_new integer;
begin
  insert into public.user_challenges (user_id, challenge_id, progress)
  values (p_user_id, p_challenge_id, least(p_amount, 100))
  on conflict (user_id, challenge_id) do update
    set progress = least(public.user_challenges.progress + p_amount, 100),
        completed_at = case
          when least(public.user_challenges.progress + p_amount, 100) >= 100
          then now() else public.user_challenges.completed_at end
  returning progress into v_new;

  return v_new;
end;
$$;

-- Compra de recompensa: valida saldo, debita moedas e registra a compra.
-- Retorna json { success, message, coins }.
create or replace function public.purchase_reward(
  p_user_id uuid, p_reward_id uuid
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_price  integer;
  v_locked boolean;
  v_coins  integer;
begin
  select price, locked into v_price, v_locked
    from public.rewards where id = p_reward_id;

  if v_price is null then
    return json_build_object('success', false, 'message', 'Recompensa não encontrada', 'coins', null);
  end if;

  if v_locked then
    return json_build_object('success', false, 'message', '🔒 Item bloqueado!', 'coins', null);
  end if;

  select coins into v_coins from public.profiles where id = p_user_id;

  if v_coins < v_price then
    return json_build_object('success', false, 'message', '⚠️ Moedas insuficientes!', 'coins', v_coins);
  end if;

  -- Já comprou?
  if exists (select 1 from public.user_rewards
             where user_id = p_user_id and reward_id = p_reward_id) then
    return json_build_object('success', false, 'message', 'Você já possui este item', 'coins', v_coins);
  end if;

  update public.profiles set coins = coins - v_price where id = p_user_id
    returning coins into v_coins;

  insert into public.user_rewards (user_id, reward_id)
  values (p_user_id, p_reward_id);

  return json_build_object('success', true, 'message', '✅ Compra realizada!', 'coins', v_coins);
end;
$$;

-- Estatísticas do dashboard do Admin (json agregado).
create or replace function public.admin_dashboard_stats()
returns json
language sql
security definer set search_path = public
as $$
  select json_build_object(
    'total_users',     (select count(*) from public.profiles),
    'active_challenges',(select count(*) from public.challenges where status = 'Ativo'),
    'open_tickets',    (select count(*) from public.tickets where status = 'Aberto'),
    'latest_revenue',  (select amount from public.revenue order by sort_order desc limit 1)
  );
$$;

-- =====================================================================
--  4. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Helper: o usuário logado é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Habilita RLS em todas as tabelas
alter table public.profiles            enable row level security;
alter table public.study_blocks        enable row level security;
alter table public.challenges          enable row level security;
alter table public.user_challenges     enable row level security;
alter table public.rewards             enable row level security;
alter table public.user_rewards        enable row level security;
alter table public.achievements        enable row level security;
alter table public.user_achievements   enable row level security;
alter table public.learning_progress   enable row level security;
alter table public.subject_performance enable row level security;
alter table public.plans               enable row level security;
alter table public.tickets             enable row level security;
alter table public.revenue             enable row level security;

-- ---- PROFILES -------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- ---- STUDY_BLOCKS (cada um vê/edita os seus) ------------------------
drop policy if exists "study_blocks_owner_all" on public.study_blocks;
create policy "study_blocks_owner_all" on public.study_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- CHALLENGES (todos leem; só admin escreve) ----------------------
drop policy if exists "challenges_read_all" on public.challenges;
create policy "challenges_read_all" on public.challenges
  for select using (true);

drop policy if exists "challenges_admin_write" on public.challenges;
create policy "challenges_admin_write" on public.challenges
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- USER_CHALLENGES (donos) ----------------------------------------
drop policy if exists "user_challenges_owner_all" on public.user_challenges;
create policy "user_challenges_owner_all" on public.user_challenges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- REWARDS (todos leem; admin escreve) ----------------------------
drop policy if exists "rewards_read_all" on public.rewards;
create policy "rewards_read_all" on public.rewards
  for select using (true);

drop policy if exists "rewards_admin_write" on public.rewards;
create policy "rewards_admin_write" on public.rewards
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- USER_REWARDS (donos) -------------------------------------------
drop policy if exists "user_rewards_owner_all" on public.user_rewards;
create policy "user_rewards_owner_all" on public.user_rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ACHIEVEMENTS (todos leem) --------------------------------------
drop policy if exists "achievements_read_all" on public.achievements;
create policy "achievements_read_all" on public.achievements
  for select using (true);

-- ---- USER_ACHIEVEMENTS (donos) --------------------------------------
drop policy if exists "user_achievements_owner_all" on public.user_achievements;
create policy "user_achievements_owner_all" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- LEARNING_PROGRESS (donos) --------------------------------------
drop policy if exists "learning_progress_owner_all" on public.learning_progress;
create policy "learning_progress_owner_all" on public.learning_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- SUBJECT_PERFORMANCE (donos) ------------------------------------
drop policy if exists "subject_perf_owner_all" on public.subject_performance;
create policy "subject_perf_owner_all" on public.subject_performance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- PLANS (todos leem; admin escreve) ------------------------------
drop policy if exists "plans_read_all" on public.plans;
create policy "plans_read_all" on public.plans
  for select using (true);

drop policy if exists "plans_admin_write" on public.plans;
create policy "plans_admin_write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- TICKETS (cria: qualquer um; lê/edita: dono ou admin) -----------
drop policy if exists "tickets_insert_any" on public.tickets;
create policy "tickets_insert_any" on public.tickets
  for insert with check (true);

drop policy if exists "tickets_select_own_or_admin" on public.tickets;
create policy "tickets_select_own_or_admin" on public.tickets
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tickets_update_admin" on public.tickets;
create policy "tickets_update_admin" on public.tickets
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- REVENUE (admin) ------------------------------------------------
drop policy if exists "revenue_read_admin" on public.revenue;
create policy "revenue_read_admin" on public.revenue
  for select using (public.is_admin());

-- =====================================================================
--  5. SEED — dados iniciais
-- =====================================================================

-- Desafios
insert into public.challenges (title, description, icon, status)
select * from (values
  ('Matemática',        'Desafio e concentração de dados',       'math',     'Ativo'),
  ('Leitura Dinâmica',  'Leia e aprenda com rapidez',            'book',     'Ativo'),
  ('Concentração total','Foque e mantenha a atenção',            'target',   'Ativo'),
  ('Revisão semanal',   'Revise o conteúdo da semana',           'clipboard','Ativo'),
  ('Química',           'Desafio e concentração de dados',       'flask',    'Ativo'),
  ('Redação',           'Escreva um texto interessante',         'pen',      'Ativo')
) as t(title, description, icon, status)
where not exists (select 1 from public.challenges);

-- Recompensas
insert into public.rewards (name, category, price, icon, locked)
select * from (values
  ('Dobra XP',  'Mais XP', 150, 'gift', true),
  ('Proteção',  'Mais XP', 180, 'gift', true),
  ('Dica',      'Dicas',    70, 'gift', false),
  ('Avatar',    'Avatar',   90, 'gift', false)
) as t(name, category, price, icon, locked)
where not exists (select 1 from public.rewards);

-- Conquistas
insert into public.achievements (title, description, reward_coins, required_challenges)
select * from (values
  ('Primeiro desafio', 'Complete 1 desafio',   30, 1),
  ('Trio de ouro',     'Complete 3 desafios',  60, 3),
  ('Maratonista',      'Complete 5 desafios',  90, 5),
  ('Lenda Mindly',     'Complete 10 desafios',150, 10)
) as t(title, description, reward_coins, required_challenges)
where not exists (select 1 from public.achievements);

-- Planos
insert into public.plans (name, price, description, users_count, sort_order)
select * from (values
  ('Grátis',        'R$ 0',          'Acesso básico para iniciantes.',     1200, 1),
  ('Premium',       'R$ 19,99/mês',  'Todos os recursos ilimitados.',       450, 2),
  ('Institucional', 'Contato',       'Soluções para escolas e universidades.',30, 3)
) as t(name, price, description, users_count, sort_order)
where not exists (select 1 from public.plans);

-- Receita mensal
insert into public.revenue (month, amount, sort_order)
select * from (values
  ('Mai', 3200, 1),
  ('Jun', 4500, 2),
  ('Jul', 4100, 3),
  ('Ago', 6800, 4),
  ('Set', 7200, 5),
  ('Out', 8900, 6)
) as t(month, amount, sort_order)
where not exists (select 1 from public.revenue);

-- =====================================================================
--  FIM. Próximos passos:
--   1) Authentication > Providers: habilite Email (e Google, se quiser).
--   2) Para tornar alguém admin manualmente:
--        update public.profiles set role = 'admin' where email = 'seu@email.com';
--   3) Copie URL e anon key em Project Settings > API para o .env do front.
-- =====================================================================
