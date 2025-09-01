// /api/ask: RAG 질의응답 API
// 질문 → intent 분류 → 벡터 검색 → JSON 컨텍스트 → GPT 응답 → 로그 저장

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/lib/embeddings";
import OpenAI from "openai";

// Supabase 클라이언트 생성 (service_role 키 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 번역 데이터
const TRANSLATIONS = {
  en: {
    noAnswer: "Sorry, I cannot generate an answer.",
    parseError: "Unable to parse response.",
    formatError: "Response format error occurred.",
    noInfo:
      "No information available for this topic. Please ask another question.",
  },
  ja: {
    noAnswer: "申し訳ございません。回答を生成できません。",
    parseError: "応答を解析できません。",
    formatError: "応答形式エラーが発生しました。",
    noInfo: "この内容に関する情報がありません。他の質問をしてください。",
  },
  zh: {
    noAnswer: "抱歉，无法生成答案。",
    parseError: "无法解析响应。",
    formatError: "响应格式错误。",
    noInfo: "没有相关信息。请询问其他问题。",
  },
  ko: {
    noAnswer: "죄송합니다. 답변을 생성할 수 없습니다.",
    parseError: "응답을 파싱할 수 없습니다.",
    formatError: "응답 형식 오류가 발생했습니다.",
    noInfo: "해당 내용에 대한 정보가 없습니다. 다른 질문을 해주세요.",
  },
};

// 번역 함수
function t(lang: string, key: keyof typeof TRANSLATIONS.en): string {
  return (
    TRANSLATIONS[lang as keyof typeof TRANSLATIONS]?.[key] ||
    TRANSLATIONS.en[key]
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 설정 가져오기 함수
async function getSetting(
  key: string,
  defaultValue: string = "0.28"
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) {
      console.log(
        `설정 ${key}를 찾을 수 없어 기본값 ${defaultValue}를 사용합니다.`
      );
      return defaultValue;
    }

    return data.value;
  } catch (error) {
    console.log(
      `설정 ${key} 조회 중 오류 발생, 기본값 ${defaultValue}를 사용합니다:`,
      error
    );
    return defaultValue;
  }
}

// JSON 컨텍스트 타입 정의
interface JsonContext {
  intent: string;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  summary_ko?: string;
  summary_en?: string;
  details_ko?: Record<string, unknown>;
  details_en?: Record<string, unknown>;
  original_input: string;
  created_at: string;
}

// 벡터 검색 결과 타입 정의
interface VectorSearchResult {
  id: number;
  json_path: string;
  similarity: number;
  summary?: string;
}

// Blocks JSON 응답 타입 정의
interface Block {
  type: "text" | "link" | "image" | "map";
  text?: string;
  url?: string;
  title?: string;
  description?: string;
  details?: string;
}

// JSON 컨텍스트 로드 함수
async function loadJsonContexts(
  jsonPaths: string[],
  language: string = "ko"
): Promise<JsonContext[]> {
  const contexts: JsonContext[] = [];

  console.log("=== JSON 컨텍스트 로드 시작 ===");
  console.log("로드할 JSON 경로 개수:", jsonPaths.length);
  console.log("언어:", language);

  for (const path of jsonPaths) {
    try {
      console.log(`\nJSON 로드 시도: ${path}`);
      const { data, error } = await supabase.storage
        .from("kuris-json")
        .download(path);

      if (!error && data) {
        const text = await data.text();
        const jsonData = JSON.parse(text);

        // 언어별로 적절한 summary와 details 선택
        const context: JsonContext = {
          intent: jsonData.intent,
          title: jsonData.title,
          summary:
            language === "en" ? jsonData.summary_en : jsonData.summary_ko,
          details:
            language === "en" ? jsonData.details_en : jsonData.details_ko,
          summary_ko: jsonData.summary_ko,
          summary_en: jsonData.summary_en,
          details_ko: jsonData.details_ko,
          details_en: jsonData.details_en,
          original_input: jsonData.original_input,
          created_at: jsonData.created_at,
        };

        contexts.push(context);
        console.log(`✅ JSON 로드 성공: ${path}`);
        console.log(`  - Title: ${context.title}`);
        console.log(`  - Intent: ${context.intent}`);
        console.log(`  - Language: ${language}`);
      } else {
        console.log(`❌ JSON 로드 실패: ${path}`);
        console.log(`  - Error: ${error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`❌ JSON 파싱 실패: ${path}`);
      console.log(
        `  - Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.warn(`Failed to load JSON context from ${path}:`, error);
    }
  }

  console.log(`\n=== JSON 컨텍스트 로드 완료 ===`);
  console.log(`성공적으로 로드된 컨텍스트 개수: ${contexts.length}`);

  return contexts;
}

// GPT Blocks JSON 응답 생성 함수
async function createBlocksAnswer(
  question: string,
  contexts: JsonContext[],
  language: string
): Promise<{
  blocks: Block[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}> {
  const contextBlocks = contexts
    .map(
      (ctx, i) =>
        `<doc id="guideline_${i + 1}">\nsummary: ${
          ctx.summary
        }\ndetails: ${JSON.stringify(ctx.details, null, 2)}\n</doc>`
    )
    .join("\n\n");

  const systemPrompt = `# System
너는 KUris 챗봇이다.  
반드시 "교환학생 · 학교생활 · 행정" 관련 질문에만 답한다.  
다른 주제(예: 수학 문제, 일반 상식 등)는 "해당 질문은 KUris의 응답 범위를 벗어납니다."고 응답한다.

- 제공된 JSON context 외의 사적 지식(헛웃음, 잡담)은 사용하지 말 것.  
- **반드시 ${language === "ko" ? "한국어" : "English"}로만 답변하라.**  
- JSON \`summary\` 는 간략 설명, \`details\` 에 필요한 숫자·장소·연락처가 담겨 있다.  
- 반드시 JSON 형식으로 응답하라: { "blocks": [...] }
- blocks 타입: "text"(일반 텍스트), "link"(링크), "image"(이미지), "map"(지도)

## 응답 형식 가이드라인
- **문단 분리**: 각 단계나 주제별로 명확히 문단을 나누어라
- **번호 매기기**: 단계별 설명은 1, 2, 3... 형태로 번호를 매겨라
- **굵은 글씨**: 중요한 키워드나 제목은 **굵은 글씨**로 강조하라
- **줄바꿈**: 각 문단 사이에 적절한 줄바꿈을 넣어라
- **구조화**: 제목 → 설명 → 세부사항 순서로 구조화하라

## 언어 규칙
- 질문 언어와 관계없이 **반드시 ${
    language === "ko" ? "한국어" : "English"
  }로만 답변**
- ${language === "ko" ? "한국어" : "English"} 외의 언어 사용 금지

## JSON Context
${contextBlocks}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      blocks: [{ type: "text", text: t(language, "noAnswer") }],
      usage: response.usage,
    };
  }

  try {
    const parsed = JSON.parse(content) as { blocks: Block[] };
    return {
      blocks: parsed.blocks || [
        { type: "text", text: t(language, "parseError") },
      ],
      usage: response.usage,
    };
  } catch (error) {
    console.error("JSON parsing error:", error);
    return {
      blocks: [{ type: "text", text: t(language, "formatError") }],
      usage: response.usage,
    };
  }
}

// GPT Blocks JSON 응답 생성 함수 (스트리밍 모드 - NDJSON 안정화)
async function createStreamingBlocksAnswer(
  question: string,
  contexts: JsonContext[],
  language: string
): Promise<ReadableStream<Uint8Array>> {
  const contextBlocks = contexts
    .map(
      (ctx, i) =>
        `<doc id="guideline_${i + 1}">\nsummary: ${
          ctx.summary
        }\ndetails: ${JSON.stringify(ctx.details, null, 2)}\n</doc>`
    )
    .join("\n\n");

  const systemPrompt = `# System
너는 KUris 챗봇이다.
- 제공된 JSON context 외의 사적 지식 사용 금지
- **반드시 ${language === "ko" ? "한국어" : "English"}로만 답변하라**
- 반드시 최종 출력은 { "blocks": [...] } JSON 하나로 작성하라.

## 언어 규칙
- 질문 언어와 관계없이 **반드시 ${
    language === "ko" ? "한국어" : "English"
  }로만 답변**
- ${language === "ko" ? "한국어" : "English"} 외의 언어 사용 금지

## Block 구조 규칙
- blocks 타입: "text" | "link" | "image" | "map"
- **text 타입**: 반드시 "text" 속성에 메인 내용을 넣어라
- **text 블록 예시**: 
  {
    "type": "text",
    "text": "메인 텍스트 내용 (마크다운 형식 지원)"
  }
- 텍스트는 제목/설명/세부 항목으로 구조화 (굵게/번호/줄바꿈)

## JSON Context
${contextBlocks}`;

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // OpenAI 스트림 시작
        const openaiStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        });

        // 상태
        let buf = ""; // 전체 누적 버퍼
        let inString = false; // JSON 문자열 내부 여부
        let escape = false; // 이스케이프 직후 여부
        let depth = 0; // 중괄호 깊이
        let seenBlocksKey = false; // "blocks" 키를 봤는가
        let inBlocks = false; // blocks 배열 안인가
        let objStart = -1; // 현재 객체 시작 인덱스(buf 기준)
        let lastCut = 0; // 메모리 절약용 컷 포인트

        const emitBlock = (raw: string) => {
          try {
            const obj = JSON.parse(raw); // 유효성 보장
            // NDJSON 형식으로 한 줄씩 전송 (data: 접두사 없음)
            const line = JSON.stringify(obj) + "\n";
            controller.enqueue(encoder.encode(line));
          } catch {
            /* 무시(불완전/일시적 조각) */
          }
        };

        for await (const chunk of openaiStream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) continue;

          // 누적 버퍼에 새 청크 더하기
          const startIdx = buf.length;
          buf += delta;

          // 새로 들어온 구간만 스캔
          for (let i = 0; i < delta.length; i++) {
            const ch = delta[i];
            const abs = startIdx + i; // buf 기준 절대 인덱스

            // 문자열/이스케이프
            if (escape) {
              escape = false;
              continue;
            }
            if (ch === "\\") {
              escape = true;
              continue;
            }
            if (ch === '"') {
              inString = !inString;
              continue;
            }
            if (inString) continue;

            // "blocks" 키 탐지(아주 단순한 스캐너)
            // ... "blocks" ... : [
            if (!seenBlocksKey) {
              // buf의 최근 일부에서 "blocks" 토큰이 등장했는지 확인
              const window = buf.slice(Math.max(0, abs - 10), abs + 7);
              if (window.includes('"blocks"')) {
                seenBlocksKey = true;
              }
            } else if (!inBlocks) {
              if (ch === "[") {
                inBlocks = true; // blocks 배열 진입
                continue;
              }
            }

            // 중괄호 깊이 추적
            if (ch === "{") {
              depth++;
              // blocks 배열 내부에서 깊이 2에서 객체 시작 포착
              if (inBlocks && depth === 2 && objStart === -1) {
                objStart = abs;
              }
            } else if (ch === "}") {
              // 객체 종료 포착
              if (inBlocks && depth === 2 && objStart !== -1) {
                const raw = buf.slice(objStart, abs + 1);
                emitBlock(raw);
                objStart = -1;
                // 메모리 컷: 방금 객체 끝까지 잘라내도 되지만
                // 안전하게 lastCut 갱신만 하고, 주기적으로 컷해도 됨
                lastCut = abs + 1;
              }
              depth--;
            }

            // blocks 배열 종료 감지
            if (inBlocks && ch === "]" && depth === 1) {
              inBlocks = false;
            }
          }

          // 메모리 절약: 컷 포인트 이전은 제거
          if (lastCut > 0 && lastCut > buf.length / 2) {
            buf = buf.slice(lastCut);
            lastCut = 0;
            // objStart가 있었으면 재정렬 필요하지만,
            // 우리는 objStart가 -1일 때만 컷하도록 위에서만 갱신
          }
        }

        controller.close();
      } catch (err) {
        console.error("GPT streaming error:", err);
        controller.error(err);
      }
    },
  });
}

// 스트리밍 JSON 응답 생성 함수

export async function POST(req: NextRequest) {
  try {
    const { question, language = "ko", stream = false } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // 언어 검증 (한국어와 영어만 허용)
    if (language !== "ko" && language !== "en") {
      return NextResponse.json(
        { error: "Only Korean (ko) and English (en) are supported" },
        { status: 400 }
      );
    }

    console.log("=== 언어 설정 ===");
    console.log("선택된 언어:", language);
    console.log("질문:", question);

    // ① intent 분류 (주석처리)
    // const intent = await classifyIntent(question);

    // fallback인 경우 "정보 없음" 응답 (주석처리)
    // if (intent.id === "fallback-intent-id") {
    //   return NextResponse.json({
    //     blocks: [
    //       {
    //         type: "text",
    //         text: t(language, "noInfo"),
    //       },
    //     ],
    //     intent: intent.name,
    //     contexts_used: 0,
    //   });
    // }

    // ② FTS 후보 검색 (주석처리)
    // const keywords = extractKeyword(question);
    // const { data: ftsResults } = await supabase
    //   .from("guidelines")
    //   .select("*")
    //   .ilike("summary", `%${keywords}%`)
    //   .limit(5);

    // ③ 벡터 후보 검색 (수정: intent_id 제거)
    console.log("=== 임베딩 생성 ===");
    console.log("질문:", question);
    const qEmb = await getEmbedding(question);
    console.log("임베딩 생성 완료, 길이:", qEmb.length);

    console.log("=== 벡터 검색 호출 ===");

    // 데이터베이스 확인 (디버깅용)
    const { data: allGuidelines, error: checkError } = await supabase
      .from("guidelines")
      .select("id, title, summary, embedding_ko, embedding_en")
      .limit(5);

    if (checkError) {
      console.log("데이터베이스 확인 오류:", checkError);
    }

    // 설정에서 match_threshold 가져오기
    const matchThreshold = parseFloat(
      await getSetting("match_threshold", "0.28")
    );

    console.log("=== 현재 설정 ===");
    console.log("Match Threshold:", matchThreshold);

    const { data: vecResults, error: vecError } = await supabase.rpc(
      "match_guidelines_by_vec",
      {
        intent_id: null, // intent 분류 없이 모든 intent에서 검색
        query_embedding: qEmb,
        language: language, // 언어별 임베딩 사용
        match_threshold: matchThreshold, // 설정에서 가져온 임계값 사용
        match_count: 5, // 더 많은 결과 가져오기
      }
    );

    if (vecError) {
      console.log("벡터 검색 오류:", vecError);
    }

    // 디버깅: 벡터 검색 결과 출력
    console.log("=== 벡터 검색 결과 ===");
    console.log("검색된 row 개수:", vecResults?.length || 0);
    if (vecResults && vecResults.length > 0) {
      (vecResults as VectorSearchResult[]).forEach(
        (result: VectorSearchResult, index: number) => {
          console.log(`Row ${index + 1}:`);
          console.log(`  - ID: ${result.id}`);
          console.log(`  - JSON Path: ${result.json_path}`);
          console.log(`  - Similarity: ${result.similarity}`);
          console.log(`  - Summary: ${result.summary?.substring(0, 100)}...`);
        }
      );
    } else {
      console.log("벡터 검색 결과가 없습니다.");
    }

    // ④ JSON 컨텍스트 로드
    const allResults = [...(vecResults || [])]; // FTS 결과 제거
    const uniquePaths = [...new Set(allResults.map((g) => g.json_path))];

    // 디버깅: JSON 경로 출력
    console.log("=== JSON 경로 ===");
    console.log("고유 JSON 경로 개수:", uniquePaths.length);
    uniquePaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });

    const jsonContexts = await loadJsonContexts(uniquePaths, language);

    // ⑤ GPT Blocks JSON 응답 생성
    let answer;
    const contexts_used = jsonContexts.length;

    if (contexts_used === 0) {
      // Fallback: 컨텍스트가 없을 때 기본 응답
      console.log("=== Fallback 응답 생성 ===");

      if (stream) {
        // 스트리밍 모드: fallback 응답을 스트리밍으로 전송
        const fallbackBlocks = [
          {
            type: "text",
            text: t(language, "noInfo"),
          },
        ];

        const encoder = new TextEncoder();
        const fallbackStream = new ReadableStream({
          start(controller) {
            // fallback 블록을 NDJSON 형식으로 전송
            fallbackBlocks.forEach((block) => {
              const line = JSON.stringify(block) + "\n";
              controller.enqueue(encoder.encode(line));
            });
            controller.close();
          },
        });

        // 로그 저장
        await supabase.from("chat_logs").insert({
          user_id: null,
          question,
          answer: "fallback_response",
          intent: "fallback",
          tokens_in: null,
          tokens_out: null,
        });

        return new Response(fallbackStream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      } else {
        // 일반 모드: 기존 방식 사용
        answer = {
          blocks: [
            {
              type: "text",
              text: t(language, "noInfo"),
            },
          ],
          usage: undefined,
        };
      }
    } else {
      // 정상적인 GPT 응답 생성
      if (stream) {
        // 스트리밍 모드: 실제 GPT 스트리밍 사용
        const streamingResponse = await createStreamingBlocksAnswer(
          question,
          jsonContexts,
          language
        );

        // 로그 저장 (스트리밍의 경우 간단한 로그)
        await supabase.from("chat_logs").insert({
          user_id: null,
          question,
          answer: "streaming_response",
          intent: "vector-only",
          tokens_in: null,
          tokens_out: null,
        });

        return new Response(streamingResponse, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // 프록시 버퍼링 방지
          },
        });
      } else {
        // 일반 모드: 기존 방식 사용
        answer = await createBlocksAnswer(question, jsonContexts, language);
      }
    }

    // ⑥ 로그 저장 (일반 모드만)
    if (!stream) {
      await supabase.from("chat_logs").insert({
        user_id: null, // 익명 사용자
        question,
        answer: JSON.stringify(answer.blocks), // blocks JSON 저장
        intent: contexts_used === 0 ? "fallback" : "vector-only", // fallback 구분
        tokens_in: answer.usage?.prompt_tokens,
        tokens_out: answer.usage?.completion_tokens,
      });
    }

    // 일반 JSON 응답
    return NextResponse.json({
      blocks: answer.blocks,
      intent: contexts_used === 0 ? "fallback" : "vector-only",
      contexts_used: contexts_used,
    });
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
