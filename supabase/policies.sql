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

-- contacts 테이블 생성
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,                      -- 운영진 이름
  position text,                           -- 직책
  instagram text,                          -- 인스타그램 계정명
  kakao_id text,                          -- 카카오톡 ID
  phone text,                              -- 전화번호
  created_at timestamptz default now()
);

-- contacts 테이블 RLS 정책 설정
alter table public.contacts enable row level security;

-- 모든 사용자가 연락처를 볼 수 있음 (챗봇 프론트용)
create policy "Anyone can view contacts" on public.contacts
  for select using (true);

-- 관리자만 연락처를 생성할 수 있음
create policy "Admin can insert contacts" on public.contacts
  for insert with check (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 관리자만 연락처를 수정할 수 있음
create policy "Admin can update contacts" on public.contacts
  for update using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 관리자만 연락처를 삭제할 수 있음
create policy "Admin can delete contacts" on public.contacts
  for delete using (
    auth.jwt() ->> 'role' = 'admin'
  );