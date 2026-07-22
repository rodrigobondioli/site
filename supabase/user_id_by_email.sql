-- Lookup CONFIÁVEL de usuário por e-mail (rodar no SQL editor do Supabase).
-- Motivo: o filtro ?email= do admin do GoTrue não filtra de fato — retornava o
-- primeiro usuário da lista, fazendo o webhook/admin liberar acesso pra conta errada.
-- Esta função é usada por api/_auth.js -> resolveUserByEmail().

create or replace function public.user_id_by_email(p_email text)
returns uuid language sql security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function public.user_id_by_email(text) from public;
grant execute on function public.user_id_by_email(text) to service_role;
