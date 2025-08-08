-- 04_match_guidelines_by_vec.sql: KUris 챗봇 guidelines 벡터 top-k 매칭 함수

-- Requires: extension "vector" already enabled
create or replace function public.match_guidelines_by_vec(
  intent_id uuid,
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 3
)
returns table (
  id uuid,
  json_path text,
  title text,
  score float
)
language sql stable
as $$
  select
    g.id,
    g.json_path,
    g.title,
    1 - (g.summary_embedding <=> query_embedding) as score
  from public.guidelines g
  where (match_guidelines_by_vec.intent_id is null or g.intent_id = match_guidelines_by_vec.intent_id)
    and g.summary_embedding <=> query_embedding < (1 - match_threshold)
  order by g.summary_embedding <=> query_embedding   -- ascending = closer
  limit match_count;
$$; 