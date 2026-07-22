-- Bucket + policies pra foto de perfil (rodar no SQL editor do Supabase).
-- A foto agora vai pro Storage (não mais base64 no user_metadata).
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;

drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "avatar insert own" on storage.objects;
create policy "avatar insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
