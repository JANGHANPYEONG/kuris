-- 02_create_guidelines.sql: KUris 챗봇 guidelines 테이블 및 pgvector 확장

-- pgvector 확장 설치 (이미 설치되어 있다면 무시)
create extension if not exists vector;

create table if not exists public.guidelines (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references intents(id) on delete cascade,
  title text,
  json_path text not null,                 -- kuris-json/...
  original_type text check (original_type in ('text','link','file')),
  original_ref text,                       -- 링크 URL or storage path or raw text
  summary text not null,
  embedding_ko vector(1536),               -- 한국어 임베딩 (pgvector)
  embedding_en vector(1536),               -- 영어 임베딩 (pgvector)
  expires_at timestamptz,
  created_at timestamptz default now(),
  uploaded_by uuid
);

-- 한국어 임베딩 인덱스
create index if not exists guidelines_embedding_ko_idx
  on guidelines using ivfflat (embedding_ko) with (lists = 1024);

-- 영어 임베딩 인덱스
create index if not exists guidelines_embedding_en_idx
  on guidelines using ivfflat (embedding_en) with (lists = 1024);

create index if not exists guidelines_intent_id_idx
  on guidelines (intent_id); 