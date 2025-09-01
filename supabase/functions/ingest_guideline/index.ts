// ingest_guideline Edge Function
// 관리자가 업로드한 지침 → 자동 intent 분류 + JSON·원본 저장 + 요약 임베딩 생성

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { text, link, fileBase64, filename, retentionDays, uploadedBy } =
      await req.json();

    // 텍스트 정리 (마크다운 코드 블록 제거)
    const cleanText = text ? text.replace(/```[\s\S]*?```/g, "").trim() : text;
    const original_input = cleanText ?? link ?? filename;

    if (!original_input) {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    /* 1️⃣ GPT : intent·title·tags·summary·details 추출 (한국어 + 영어) */
    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that analyzes KUris (Korea University exchange student) guidelines and extracts structured information in both Korean and English.
            
            CRITICAL REQUIREMENT: You MUST include BOTH full terms AND abbreviations/synonyms in BOTH directions for better vector search.
            
            Return a JSON object with the following fields:
            - intent: category like "life/food", "visa/arc", "academic", "housing", "transportation", "health", "emergency"
            - title: concise title for the guideline
            - summary_ko: brief summary in Korean (MUST include both full terms and abbreviations)
            - summary_en: brief summary in English (MUST include both full terms and abbreviations)
            - details_ko: structured JSON object with specific information in Korean (MUST include both full terms and abbreviations)
            - details_en: structured JSON object with specific information in English (MUST include both full terms and abbreviations)
            
            BIDIRECTIONAL SYNONYMS - YOU MUST INCLUDE BOTH:
            - "Alien Registration Card" → MUST include "ARC" 
            - "ARC" → MUST include "Alien Registration Card"
            - "외국인등록증" → MUST include "ARC"
            - "Visa" → MUST include "비자", "입국허가", "entry permit"
            - "비자" → MUST include "Visa", "입국허가"
            - "Dormitory" → MUST include "기숙사", "기숙", "dorm"
            - "기숙사" → MUST include "Dormitory", "dorm"
            
            FORMAT EXAMPLE:
            Korean: "ARC(외국인등록증, Alien Registration Card) 신청 안내"
            English: "ARC(Alien Registration Card, 외국인등록증) application guide"
            
            REMEMBER: Always include both the full term AND its abbreviation/synonym in the same text!`,
            },
            {
              role: "user",
              content: `Analyze this KUris guideline and provide information in both Korean and English: ${original_input}`,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!gptResponse.ok) {
      throw new Error(`OpenAI API error: ${gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    let content = gptData.choices[0].message.content;

    // 마크다운 코드 블록 제거
    content = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*$/g, "")
      .trim();

    const meta = JSON.parse(content);

    /* 2️⃣ intent row upsert */
    const { data: intentRow, error: intentError } = await supabase
      .from("intents")
      .upsert(
        { name: meta.intent },
        { onConflict: "name", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (intentError) {
      throw new Error(`Intent upsert error: ${intentError.message}`);
    }

    /* 3️⃣ guideline row 작성 */
    const gid = crypto.randomUUID();

    /* 3-1. 구조화 JSON 저장 */
    const jsonObj = {
      ...meta,
      original_input,
      created_at: new Date().toISOString(),
    };
    const jsonPath = `${meta.intent}/${gid}.json`;

    const { error: jsonError } = await supabase.storage
      .from("kuris-json")
      .upload(
        jsonPath,
        new Blob([JSON.stringify(jsonObj)], { type: "application/json" })
      );

    if (jsonError) {
      throw new Error(`JSON storage error: ${jsonError.message}`);
    }

    /* 3-2. 원본 파일 저장(선택) */
    let originalType = "text",
      originalRef = text;
    if (link) {
      originalType = "link";
      originalRef = link;
    }
    if (fileBase64) {
      originalType = "file";
      const bin = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      originalRef = `${meta.intent}/${gid}-${filename}`;

      const { error: fileError } = await supabase.storage
        .from("kuris-assets")
        .upload(originalRef, bin);

      if (fileError) {
        throw new Error(`File storage error: ${fileError.message}`);
      }
    }

    /* 3-3. 한국어와 영어 각각 임베딩 생성 */
    // 한국어 임베딩 생성
    const fullTextKo = `${meta.summary_ko}\n\n${JSON.stringify(
      meta.details_ko,
      null,
      2
    )}`;

    const embKoResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: fullTextKo,
      }),
    });

    if (!embKoResponse.ok) {
      throw new Error(
        `Korean embedding API error: ${embKoResponse.statusText}`
      );
    }

    const embKoData = await embKoResponse.json();
    const embeddingKo = embKoData.data[0].embedding;

    // 영어 임베딩 생성
    const fullTextEn = `${meta.summary_en}\n\n${JSON.stringify(
      meta.details_en,
      null,
      2
    )}`;

    const embEnResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: fullTextEn,
      }),
    });

    if (!embEnResponse.ok) {
      throw new Error(
        `English embedding API error: ${embEnResponse.statusText}`
      );
    }

    const embEnData = await embEnResponse.json();
    const embeddingEn = embEnData.data[0].embedding;

    /* 3-4. guidelines insert */
    const { error: guidelineError } = await supabase.from("guidelines").insert({
      id: gid,
      intent_id: intentRow.id,
      title: meta.title,
      json_path: jsonPath,
      summary: meta.summary_ko, // 기본값으로 한국어 summary 사용
      embedding_ko: embeddingKo,
      embedding_en: embeddingEn,
      original_type: originalType,
      original_ref: originalRef,
      expires_at: retentionDays
        ? new Date(Date.now() + retentionDays * 86400_000).toISOString()
        : null,
      uploaded_by: uploadedBy,
    });

    if (guidelineError) {
      throw new Error(`Guideline insert error: ${guidelineError.message}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        id: gid,
        intent: meta.intent,
        title: meta.title,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ingest_guideline error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
