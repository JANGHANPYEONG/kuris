-- 05_rls_policies.sql: KUris 챗봇 RLS(행 수준 보안) 정책 설정

-- intents 테이블 RLS 활성화
alter table intents enable row level security;

-- guidelines 테이블 RLS 활성화
alter table guidelines enable row level security;

-- guidelines SELECT 정책 (모든 사용자 허용)
create policy "ReadAll" on guidelines for select using (true);

-- guidelines INSERT/UPDATE/DELETE 정책 (admin만 허용)
create policy "AdminWrite" on guidelines
  for all using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- chat_logs 테이블 RLS 활성화
alter table chat_logs enable row level security;

-- chat_logs INSERT 정책 (누구나 허용, 익명 허용)
create policy "InsertAny" on chat_logs
  for insert with check (true);

-- chat_logs SELECT 정책 (자신의 로그 또는 익명 로그만)
create policy "ReadOwnOrAnon" on chat_logs
  for select using (user_id is null or auth.uid() = user_id); 