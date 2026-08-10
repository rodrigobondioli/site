-- =====================================================================
-- N.A.V.E. — schema Supabase / Postgres
-- v1: usuário único (RLS por owner). Todas as tabelas com prefixo nave_ para
-- conviver com o schema do app do curso no MESMO projeto Supabase.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type nave_macro_stage as enum ('PRE','COLETANDO','EXPLORANDO','CRIANDO','DEFININDO','POS');
exception when duplicate_object then null; end $$;
do $$ begin
  create type nave_run_status as enum ('nao_iniciado','em_andamento','bloqueado','concluido','pulado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type nave_gate_status as enum ('pendente','enviado','aprovado','ajustes_pedidos');
exception when duplicate_object then null; end $$;
do $$ begin
  create type nave_axis as enum ('N','A','V','E','-');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- CATÁLOGO — o método codificado. Não muda por projeto.
-- =====================================================================

create table if not exists nave_phases (
  id            text primary key,              -- 'F0'..'F15'
  ord           int  not null,
  macro         nave_macro_stage not null,
  name          text not null,
  objective     text not null,
  deliverable   text,                           -- nome do entregável, se houver
  is_gate       boolean not null default false, -- trava avanço
  gate_label    text,                           -- 'Âncora 1 — Diagnóstico aprovado'
  default_days  int  not null default 3,
  source        text                            -- 'M06 A04'
);

create table if not exists nave_task_templates (
  id          uuid primary key default gen_random_uuid(),
  phase_id    text not null references nave_phases(id) on delete cascade,
  ord         int  not null,
  title       text not null,
  detail      text,
  required    boolean not null default true,
  unique (phase_id, ord)
);

create table if not exists nave_exercises (
  id          text primary key,                 -- 'N1','V6','NM3'...
  phase_id    text not null references nave_phases(id),
  axis        nave_axis not null default '-',
  name        text not null,
  intro       text,
  minimum     boolean not null default false,   -- mínimo viável indicado no método
  duration_min int,
  source      text,
  condition   text,                             -- ex.: 'marca_existente'
  homework    boolean not null default false,   -- pode ir antes da imersão
  repeatable_per text                           -- ex.: 'pessoa'
);

create table if not exists nave_exercise_fields (
  id          uuid primary key default gen_random_uuid(),
  exercise_id text not null references nave_exercises(id) on delete cascade,
  ord         int  not null,
  key         text not null,
  label       text not null,
  type        text not null,                    -- text|longtext|list|table|select|multiselect|matrix|number|url|file
  hint        text,
  config      jsonb not null default '{}'::jsonb, -- columns, rows, options, min/max
  unique (exercise_id, key)
);


-- curadoria em três camadas (espinha / sinal / extra) — inferência a partir dos entregáveis
alter table nave_exercises add column if not exists tier   text;
alter table nave_exercises add column if not exists sessao text;
alter table nave_exercises add column if not exists porque text;
alter table nave_exercises add column if not exists blocos      int;
alter table nave_exercises add column if not exists min_bloco   int;
alter table nave_exercises add column if not exists tempo_fonte text;
alter table nave_exercises add column if not exists ficha       boolean;

-- Critérios de decisão (matrizes da Parte 7)
create table if not exists nave_decision_criteria (
  id        uuid primary key default gen_random_uuid(),
  decision  text not null,                      -- 'posicionamento','conceito_criativo','nome'
  criterion text not null,
  cut_rule  text
);

-- =====================================================================
-- OPERAÇÃO — por cliente e projeto
-- =====================================================================

create table if not exists nave_clients (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid(),
  name        text not null,
  segment     text,
  contact     text,
  email       text,
  brand_exists boolean not null default true,   -- liga/desliga exercícios condicionais
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists nave_projects (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null default auth.uid(),
  client_id     uuid not null references nave_clients(id) on delete cascade,
  name          text not null,
  status        nave_run_status not null default 'em_andamento',
  started_at    date,
  target_end    date,
  -- objetivo principal (exercício N6) promovido para o topo: aparece em toda tela
  main_objective text,
  point_a       text,
  point_b       text,
  -- integrações
  drive_folder_id  text,
  calendar_id      text,
  created_at    timestamptz not null default now()
);

create table if not exists nave_project_phases (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references nave_projects(id) on delete cascade,
  phase_id     text not null references nave_phases(id),
  status       nave_run_status  not null default 'nao_iniciado',
  gate         nave_gate_status not null default 'pendente',
  gate_note    text,
  gate_evidence_url text,
  approved_at  timestamptz,
  started_at   timestamptz,
  completed_at timestamptz,
  planned_start date,
  planned_end   date,
  drive_folder_id text,
  unique (project_id, phase_id)
);

create table if not exists nave_project_tasks (
  id               uuid primary key default gen_random_uuid(),
  project_phase_id uuid not null references nave_project_phases(id) on delete cascade,
  template_id      uuid references nave_task_templates(id),
  ord              int not null default 0,
  title            text not null,
  detail           text,
  status           nave_run_status not null default 'nao_iniciado',
  due_date         date,
  link_url         text,
  completed_at     timestamptz
);

-- Seleção de exercícios: a decisão da Fase 2 (quais rodar no workshop)
create table if not exists nave_project_exercises (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references nave_projects(id) on delete cascade,
  exercise_id  text not null references nave_exercises(id),
  selected     boolean not null default false,
  rationale    text,                            -- por que escolhi este (vem das entrevistas)
  status       nave_run_status not null default 'nao_iniciado',
  instance_label text,                          -- p/ repetíveis: 'Entrevista — Marina, sócia'
  created_at   timestamptz not null default now(),
  unique (project_id, exercise_id)
);

-- Respostas: um registro por campo. jsonb aguenta tabela, matriz e lista.
create table if not exists nave_exercise_responses (
  id                  uuid primary key default gen_random_uuid(),
  project_exercise_id uuid not null references nave_project_exercises(id) on delete cascade,
  field_key           text not null,
  value               jsonb not null default 'null'::jsonb,
  updated_at          timestamptz not null default now(),
  unique (project_exercise_id, field_key)
);

-- =====================================================================
-- ARTEFATOS TRANSVERSAIS
-- =====================================================================

create table if not exists nave_insights (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references nave_projects(id) on delete cascade,
  source       text,                            -- 'imersão','entrevista Marina','pesquisa'
  data_point   text,                            -- o dado cru, com fonte
  pattern      text,
  tension      text,
  is_symptom   boolean,
  opportunity  text,
  hypothesis   text,
  status       text default 'pendente',         -- pendente|validada|refutada
  becomes_block int,                            -- 1..6 do relatório de estratégia
  ai_generated boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists nave_deliverables (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references nave_projects(id) on delete cascade,
  phase_id    text not null references nave_phases(id),
  title       text not null,
  kind        text,                             -- 'relatorio','plataforma','keyword','keyvisual','guia'
  url         text,
  drive_file_id text,
  version     int not null default 1,
  status      text not null default 'rascunho', -- rascunho|enviado|aprovado
  created_at  timestamptz not null default now()
);

create table if not exists nave_meetings (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references nave_projects(id) on delete cascade,
  phase_id       text references nave_phases(id),
  title          text not null,
  starts_at      timestamptz,
  duration_min   int,
  attendees      text[],
  gcal_event_id  text,
  meet_url       text,
  recording_url  text,
  transcript_url text,
  notes          text
);

create table if not exists nave_ai_runs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references nave_projects(id) on delete cascade,
  kind        text not null,                    -- 'organizar_nave','contradicoes','repeticoes','rascunho_diagnostico','hipoteses'
  input_ref   text,                             -- meeting_id, url da transcrição
  input_chars int,
  output      jsonb not null default '{}'::jsonb,
  model       text,
  accepted    boolean,                          -- o humano aceitou o resultado?
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- REGRA DE GATE — o coração do app
-- =====================================================================
-- Impede marcar uma fase como concluída se a fase-gate anterior não foi aprovada.
create or replace function nave_enforce_gate() returns trigger as $$
declare
  prev_ord int;
  blocked  int;
begin
  select ord into prev_ord from nave_phases where id = new.phase_id;

  select count(*) into blocked
  from nave_project_phases pp
  join nave_phases p on p.id = pp.phase_id
  where pp.project_id = new.project_id
    and p.ord < prev_ord
    and p.is_gate
    and pp.gate <> 'aprovado';

  if new.status in ('em_andamento','concluido') and blocked > 0 then
    raise exception 'Gate anterior não aprovado. O método exige aprovação formal antes de avançar.';
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_nave_enforce_gate on nave_project_phases;
create trigger trg_nave_enforce_gate
  before update on nave_project_phases
  for each row execute function nave_enforce_gate();

-- =====================================================================
-- RLS — v1 usuário único
-- =====================================================================
alter table nave_clients            enable row level security;
alter table nave_projects           enable row level security;
alter table nave_project_phases     enable row level security;
alter table nave_project_tasks      enable row level security;
alter table nave_project_exercises  enable row level security;
alter table nave_exercise_responses enable row level security;
alter table nave_insights           enable row level security;
alter table nave_deliverables       enable row level security;
alter table nave_meetings           enable row level security;
alter table nave_ai_runs            enable row level security;

-- Uma política por tabela, com USING e WITH CHECK (sem WITH CHECK o INSERT é negado).
drop policy if exists own_clients on nave_clients;
create policy own_clients on nave_clients for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists own_projects on nave_projects;
create policy own_projects on nave_projects for all
  using (owner = auth.uid()) with check (owner = auth.uid());

-- filhas de nave_projects
drop policy if exists own_pp on nave_project_phases;
create policy own_pp on nave_project_phases for all
  using (exists (select 1 from nave_projects p where p.id = nave_project_phases.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_project_phases.project_id and p.owner = auth.uid()));

drop policy if exists own_pe on nave_project_exercises;
create policy own_pe on nave_project_exercises for all
  using (exists (select 1 from nave_projects p where p.id = nave_project_exercises.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_project_exercises.project_id and p.owner = auth.uid()));

drop policy if exists own_ins on nave_insights;
create policy own_ins on nave_insights for all
  using (exists (select 1 from nave_projects p where p.id = nave_insights.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_insights.project_id and p.owner = auth.uid()));

drop policy if exists own_del on nave_deliverables;
create policy own_del on nave_deliverables for all
  using (exists (select 1 from nave_projects p where p.id = nave_deliverables.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_deliverables.project_id and p.owner = auth.uid()));

drop policy if exists own_meet on nave_meetings;
create policy own_meet on nave_meetings for all
  using (exists (select 1 from nave_projects p where p.id = nave_meetings.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_meetings.project_id and p.owner = auth.uid()));

drop policy if exists own_ai on nave_ai_runs;
create policy own_ai on nave_ai_runs for all
  using (exists (select 1 from nave_projects p where p.id = nave_ai_runs.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_projects p where p.id = nave_ai_runs.project_id and p.owner = auth.uid()));

-- netas: sobem dois níveis até nave_projects (faltavam na v1 — RLS ligado sem política = nega tudo)
drop policy if exists own_pt on nave_project_tasks;
create policy own_pt on nave_project_tasks for all
  using (exists (select 1 from nave_project_phases pp join nave_projects p on p.id = pp.project_id
                 where pp.id = nave_project_tasks.project_phase_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_project_phases pp join nave_projects p on p.id = pp.project_id
                 where pp.id = nave_project_tasks.project_phase_id and p.owner = auth.uid()));

drop policy if exists own_er on nave_exercise_responses;
create policy own_er on nave_exercise_responses for all
  using (exists (select 1 from nave_project_exercises pe join nave_projects p on p.id = pe.project_id
                 where pe.id = nave_exercise_responses.project_exercise_id and p.owner = auth.uid()))
  with check (exists (select 1 from nave_project_exercises pe join nave_projects p on p.id = pe.project_id
                 where pe.id = nave_exercise_responses.project_exercise_id and p.owner = auth.uid()));

-- catálogo: leitura para qualquer usuário autenticado, escrita só via service role
alter table nave_phases           enable row level security;
alter table nave_task_templates   enable row level security;
alter table nave_exercises        enable row level security;
alter table nave_exercise_fields  enable row level security;
alter table nave_decision_criteria enable row level security;
do $$ declare t text; begin
  foreach t in array array['nave_phases','nave_task_templates','nave_exercises','nave_exercise_fields','nave_decision_criteria'] loop
    execute format('drop policy if exists read_catalogo on %I', t);
    execute format('create policy read_catalogo on %I for select to authenticated using (true)', t);
  end loop;
end $$;

-- =====================================================================
-- VIEWS de apoio
-- =====================================================================
create or replace view nave_v_project_progress as
select
  p.id as project_id,
  p.name,
  c.name as client,
  count(*) filter (where pp.status = 'concluido')::float / nullif(count(*),0) as pct,
  min(ph.ord) filter (where pp.status <> 'concluido') as current_ord,
  bool_or(pp.gate = 'enviado') as awaiting_approval
from nave_projects p
join nave_clients c on c.id = p.client_id
join nave_project_phases pp on pp.project_id = p.id
join nave_phases ph on ph.id = pp.phase_id
group by p.id, p.name, c.name;
