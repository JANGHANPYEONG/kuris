-- 09_add_detail_columns.sql: guidelines 테이블에 detail_ko, detail_en 컬럼 추가

-- guidelines 테이블에 detail_ko, detail_en 컬럼 추가
alter table public.guidelines 
add column if not exists detail_ko text,
add column if not exists detail_en text;

-- 컬럼에 대한 코멘트 추가
comment on column public.guidelines.detail_ko is '한국어 상세 내용';
comment on column public.guidelines.detail_en is '영어 상세 내용';
