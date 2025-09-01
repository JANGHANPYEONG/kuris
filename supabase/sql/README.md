# KUris 챗봇 데이터베이스 스키마

## 최근 변경사항 (v2.0)

### 다국어 임베딩 지원

- `summary_embedding` → `embedding_ko` + `embedding_en`으로 변경
- 한국어와 영어 질문에 대해 각각 최적화된 벡터 검색 지원
- JSON 구조에 언어별 `summary_ko/en`과 `details_ko/en` 포함

## 테이블 구조

### 1. intents

의도 분류 테이블

```sql
- id: uuid (PK)
- name: text (unique)
- retention_days: int
- created_at: timestamptz
```

### 2. guidelines

가이드라인 정보 테이블

```sql
- id: uuid (PK)
- intent_id: uuid (FK → intents.id)
- title: text
- json_path: text
- original_type: text (text/link/file)
- original_ref: text
- summary: text (기본값: 한국어 summary)
- embedding_ko: vector(1536)  # 한국어 임베딩
- embedding_en: vector(1536)  # 영어 임베딩
- expires_at: timestamptz
- created_at: timestamptz
- uploaded_by: uuid
```

### 3. chat_logs

채팅 로그 테이블

```sql
- id: uuid (PK)
- user_id: uuid (nullable)
- question: text
- answer: text
- intent: text
- tokens_in: int
- tokens_out: int
- created_at: timestamptz
```

### 4. contacts

연락처 테이블

```sql
- id: uuid (PK)
- name: text
- name_en: text
- position: text
- instagram: text
- kakao_id: text
- phone: text
- created_at: timestamptz
```

## JSON 구조 (새로운 형식)

가이드라인 JSON 파일은 다음과 같은 구조를 가집니다:

```json
{
  "intent": "life/food",
  "title": "제목",
  "summary_ko": "한국어 요약",
  "summary_en": "English summary",
  "details_ko": {
    "장소": "위치 정보",
    "연락처": "전화번호",
    "시간": "운영시간"
  },
  "details_en": {
    "Location": "Location info",
    "Contact": "Phone number",
    "Hours": "Operating hours"
  },
  "original_input": "원본 입력 텍스트",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 인덱스

### guidelines 테이블

- `guidelines_embedding_ko_idx`: 한국어 임베딩 벡터 검색용
- `guidelines_embedding_en_idx`: 영어 임베딩 벡터 검색용
- `guidelines_intent_id_idx`: intent_id 검색용

## 함수

### match_guidelines_by_vec

언어별 벡터 유사도 검색 함수

```sql
match_guidelines_by_vec(
  intent_id: uuid,
  query_embedding: vector(1536),
  language: text default 'ko',
  match_threshold: float default 0.75,
  match_count: int default 3
)
```

## 임베딩 생성 방식

### 한국어 임베딩 (`embedding_ko`)

- `summary_ko` + `details_ko`를 결합하여 생성
- 한국어 질문에 대한 벡터 검색에 사용

### 영어 임베딩 (`embedding_en`)

- `summary_en` + `details_en`을 결합하여 생성
- 영어 질문에 대한 벡터 검색에 사용

## 마이그레이션

기존 데이터를 새로운 스키마로 마이그레이션하려면:

```bash
# 1. 새 스키마 적용
psql -f 02_create_guidelines.sql

# 2. 데이터 마이그레이션
psql -f 07_migrate_embeddings.sql

# 3. 새 함수 적용
psql -f 04_match_guidelines_by_vec.sql
```

## 주의사항

- 기존 `summary_embedding` 데이터는 `embedding_ko`로 복사됩니다
- `embedding_en`은 임시로 한국어 임베딩과 동일하게 설정됩니다
- **새로운 가이드라인은 한국어와 영어 각각의 summary와 details를 포함해야 합니다**
- 향후 영어 번역본이 추가되면 `embedding_en`을 업데이트해야 합니다
- API에서 `language` 파라미터에 따라 적절한 언어의 컨텍스트를 제공합니다
