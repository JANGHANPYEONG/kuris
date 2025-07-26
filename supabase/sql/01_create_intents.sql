-- 01_create_intents.sql: KUris 챗봇 intents 테이블 생성

create table if not exists public.intents (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,               -- life/food, visa/arc, ...
  retention_days int default 90,           -- NULL = never expire
  created_at timestamptz default now()
); 