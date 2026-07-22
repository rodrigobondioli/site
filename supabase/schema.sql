-- ANTI DESIGNER PATO — schema base (rodar no SQL editor do Supabase)
-- Multi-curso desde o dia 1.

-- perfis (espelho de auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- acesso por curso (liberado pelo webhook do Greenn)
create table if not exists public.course_access (
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  granted_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- respostas do Canvas (por bloco)
create table if not exists public.canvas_answers (
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  block int not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, course_id, block)
);

-- planos gerados pelo Estrategista
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- progresso por aula
create table if not exists public.progress (
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  status text not null default 'done',
  updated_at timestamptz default now(),
  primary key (user_id, course_id, lesson_id)
);

-- cria profile automático no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: cada aluno só vê/edita o que é dele
alter table public.profiles       enable row level security;
alter table public.course_access  enable row level security;
alter table public.canvas_answers enable row level security;
alter table public.plans          enable row level security;
alter table public.progress       enable row level security;

create policy "own profile"        on public.profiles       for select using (auth.uid() = id);
create policy "own access read"    on public.course_access  for select using (auth.uid() = user_id);
create policy "own canvas"         on public.canvas_answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plans"          on public.plans          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress"       on public.progress       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- OBS: course_access só é escrito pelo service_role (webhook), que ignora RLS.
