-- 08_create_settings.sql: KUris 설정 테이블 생성

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 초기 설정값 삽입
insert into public.settings (key, value, description) values
  ('match_threshold', '0.7', '벡터 유사도 매칭 임계값 (0.0 ~ 1.0)'),
  ('max_tokens', '4000', '최대 토큰 수'),
  ('temperature', '0.7', 'AI 응답 창의성 (0.0 ~ 1.0)')
on conflict (key) do nothing;

-- RLS 정책 설정 (admin만 수정 가능)
alter table public.settings enable row level security;

create policy "Admin can read settings" on public.settings
  for select using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin can update settings" on public.settings
  for update using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin can insert settings" on public.settings
  for insert with check (auth.jwt() ->> 'role' = 'admin');

-- updated_at 자동 업데이트 트리거
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_settings_updated_at
  before update on public.settings
  for each row
  execute function update_updated_at_column();
