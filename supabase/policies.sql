-- storage.objects: Admins only
CREATE POLICY "Admins only"
ON storage.objects
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
 
-- kuris-json bucket: (template)
-- CREATE POLICY "Users can read their own JSON"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'kuris-json' AND auth.uid() = owner); 

-- chat_messages 테이블 생성
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

-- 익명/본인만 INSERT/SELECT 가능 RLS
alter table public.chat_messages enable row level security;

create policy "Allow self or anonymous insert"
  on public.chat_messages
  for insert
  with check (user_id is null or auth.uid() = user_id);

create policy "Allow self or anonymous select"
  on public.chat_messages
  for select
  using (user_id is null or auth.uid() = user_id); 