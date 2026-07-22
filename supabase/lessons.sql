-- ANTI DESIGNER PATO — tabela de AULAS (rodar no SQL editor do Supabase)
-- Fonte única de conteúdo. O app e o admin leem daqui. Multi-curso desde o dia 1.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null default 'p1-generico-especialista',
  position int not null default 0,             -- ordem na trilha
  title text not null,
  slug text,                                   -- opcional, pra url amigável
  video_provider text default 'bunny',
  video_id text,                               -- GUID do vídeo no Bunny Stream
  video_library text,                          -- Library ID do Bunny (fallback: env BUNNY_LIBRARY)
  duration text,                               -- ex "14:00"
  tagline text,                                -- frase do pôster (ex "nicho não é prisão")
  description text,                            -- "Sobre a aula" (texto/markdown simples)
  exercise jsonb default '{}'::jsonb,          -- { title, intro, steps[], criteria_label, criteria[], cta_label }
  canvas_block int,                            -- qual bloco do Canvas essa aula alimenta (null = nenhuma)
  materials jsonb default '[]'::jsonb,         -- [{ label, meta, url, type }]
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lessons_course_pos on public.lessons (course_id, position);

-- RLS ligado, SEM policies: ninguém acessa direto pelo anon/authenticated.
-- Todo acesso passa pelas APIs (/api/lessons e /api/admin/*) usando service_role, que ignora RLS.
alter table public.lessons enable row level security;

-- Bump automático do updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons
  for each row execute function public.touch_updated_at();
