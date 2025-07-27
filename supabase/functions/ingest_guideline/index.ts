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

    /* 1️⃣ GPT : intent·title·tags·summary·details 추출 */
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
              content: `You are an AI assistant that analyzes KUris (Korea University exchange student) guidelines and extracts structured information. 
            Return a JSON object with the following fields:
            - intent: category like "life/food", "visa/arc", "academic", "housing", "transportation", "health", "emergency"
            - title: concise title for the guideline
            - summary: brief summary in Korean
            - details: detailed information in Korean with specific facts, numbers, contacts, locations`,
            },
            {
              role: "user",
              content: `Analyze this KUris guideline: ${original_input}`,
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

    /* 3-3. 요약 임베딩 생성 */
    const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: meta.summary,
      }),
    });

    if (!embResponse.ok) {
      throw new Error(`Embedding API error: ${embResponse.statusText}`);
    }

    const embData = await embResponse.json();
    const embedding = embData.data[0].embedding;

    /* 3-4. guidelines insert */
    const { error: guidelineError } = await supabase.from("guidelines").insert({
      id: gid,
      intent_id: intentRow.id,
      title: meta.title,
      json_path: jsonPath,
      summary: meta.summary,
      summary_embedding: embedding,
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
