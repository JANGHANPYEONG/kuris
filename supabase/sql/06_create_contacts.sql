-- 06_create_contacts.sql: KUris 챗봇 contacts 테이블 생성

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,                      -- 운영진 이름
  name_en text,                            -- 영문 이름
  position text,                           -- 직책
  instagram text,                          -- 인스타그램 계정명
  kakao_id text,                          -- 카카오톡 ID
  phone text,                              -- 전화번호
  created_at timestamptz default now()
);

-- RLS 정책 설정
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
