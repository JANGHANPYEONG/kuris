-- 03_create_chat_logs.sql: KUris 챗봇 chat_logs 테이블 생성

create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,           -- NULL = no-login
  question text,
  answer text,
  intent text,
  tokens_in int,
  tokens_out int,
  created_at timestamptz default now()
); 