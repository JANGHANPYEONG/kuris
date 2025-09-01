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
  score float
)
language sql stable
as $$
  select
    g.id,
    g.json_path,
    g.title,
    case 
      when language = 'ko' then 1 - (g.embedding_ko <=> query_embedding)
      when language = 'en' then 1 - (g.embedding_en <=> query_embedding)
      else 1 - (g.embedding_ko <=> query_embedding)  -- 기본값은 한국어
    end as score
  from public.guidelines g
  where (match_guidelines_by_vec.intent_id is null or g.intent_id = match_guidelines_by_vec.intent_id)
    and case 
      when language = 'ko' then g.embedding_ko <=> query_embedding < (1 - match_threshold)
      when language = 'en' then g.embedding_en <=> query_embedding < (1 - match_threshold)
      else g.embedding_ko <=> query_embedding < (1 - match_threshold)  -- 기본값은 한국어
    end
  order by case 
    when language = 'ko' then g.embedding_ko <=> query_embedding
    when language = 'en' then g.embedding_en <=> query_embedding
    else g.embedding_ko <=> query_embedding  -- 기본값은 한국어
  end   -- ascending = closer
  limit match_count;
$$; 