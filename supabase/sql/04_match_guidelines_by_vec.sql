-- 04_match_guidelines_by_vec.sql: KUris 챗봇 guidelines 벡터 top-k 매칭 함수

-- Requires: extension "vector" already enabled
create or replace function public.match_guidelines_by_vec(
  intent_id uuid,
  query_embedding vector(1536),
  language text default 'ko',              -- 'ko' 또는 'en'
  match_threshold float default 0.75,
  match_count int default 3
)
returns table (
  id uuid,
  json_path text,
  title text,
  summary text,
  score float,
  matched_language text
)
language sql stable
as $$
  with ko_results as (
    select
      g.id,
      g.json_path,
      g.title,
      g.summary,
      1 - (g.embedding_ko <=> query_embedding) as score,
      'ko' as matched_language
    from public.guidelines g
    where (match_guidelines_by_vec.intent_id is null or g.intent_id = match_guidelines_by_vec.intent_id)
      and g.embedding_ko is not null
      and g.embedding_ko <=> query_embedding < (1 - match_threshold)
  ),
  en_results as (
    select
      g.id,
      g.json_path,
      g.title,
      g.summary,
      1 - (g.embedding_en <=> query_embedding) as score,
      'en' as matched_language
    from public.guidelines g
    where (match_guidelines_by_vec.intent_id is null or g.intent_id = match_guidelines_by_vec.intent_id)
      and g.embedding_en is not null
      and g.embedding_en <=> query_embedding < (1 - match_threshold)
  ),
  combined_results as (
    select * from ko_results
    union all
    select * from en_results
  )
  select 
    id,
    json_path,
    title,
    summary,
    score,
    matched_language
  from combined_results
  order by score desc
  limit match_count;
$$; 