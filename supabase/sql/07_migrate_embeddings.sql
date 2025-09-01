-- 07_migrate_embeddings.sql: 기존 summary_embedding을 embedding_ko, embedding_en으로 마이그레이션

-- ⚠️ 주의사항: 이 마이그레이션은 기존 데이터를 새로운 스키마로 변환합니다.
-- 새로운 가이드라인은 한국어와 영어 각각의 summary와 details를 포함하는 JSON 구조를 사용합니다.

-- 1. 임시 컬럼 추가
ALTER TABLE public.guidelines 
ADD COLUMN IF NOT EXISTS embedding_ko vector(1536),
ADD COLUMN IF NOT EXISTS embedding_en vector(1536);

-- 2. 기존 summary_embedding 데이터를 embedding_ko로 복사
UPDATE public.guidelines 
SET embedding_ko = summary_embedding 
WHERE summary_embedding IS NOT NULL;

-- 3. 기존 summary_embedding 데이터를 embedding_en으로도 복사 (임시)
-- ⚠️ 향후 영어 번역본이 추가되면 embedding_en을 업데이트해야 합니다
UPDATE public.guidelines 
SET embedding_en = summary_embedding 
WHERE summary_embedding IS NOT NULL;

-- 4. 기존 summary_embedding 컬럼 삭제
ALTER TABLE public.guidelines DROP COLUMN IF EXISTS summary_embedding;

-- 5. 기존 인덱스 삭제
DROP INDEX IF EXISTS guidelines_summary_embedding_idx;

-- 6. 새로운 인덱스 생성 (이미 02_create_guidelines.sql에서 생성됨)
-- create index if not exists guidelines_embedding_ko_idx
--   on guidelines using ivfflat (embedding_ko) with (lists = 1024);
-- create index if not exists guidelines_embedding_en_idx
--   on guidelines using ivfflat (embedding_en) with (lists = 1024);

-- 7. 마이그레이션 완료 확인
SELECT 
  COUNT(*) as total_guidelines,
  COUNT(embedding_ko) as has_ko_embedding,
  COUNT(embedding_en) as has_en_embedding
FROM public.guidelines;

-- 8. 새로운 JSON 구조 안내
-- 새로운 가이드라인은 다음과 같은 구조를 사용합니다:
-- {
--   "intent": "life/food",
--   "title": "제목",
--   "summary_ko": "한국어 요약",
--   "summary_en": "English summary",
--   "details_ko": { "한국어": "세부사항" },
--   "details_en": { "English": "details" },
--   "original_input": "원본 입력",
--   "created_at": "2024-01-01T00:00:00Z"
-- }
