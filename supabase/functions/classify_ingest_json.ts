// Supabase Edge Function: classify_ingest_json
// Receives JSON, classifies intent, saves to Storage (kuris-json/{intent}/{slug}.json)
// original_input 필드 필수
// (Langchain/AI 연동은 추후 구현)

import { serve } from "std/server";

interface IngestPayload {
  intent?: string;
  title: string;
  tags?: string[];
  summary?: string;
  details?: string;
  original_input: string;
  created_at?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let data: IngestPayload;
  try {
    data = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 필수 필드 체크
  if (!data.original_input || !data.title) {
    return new Response("Missing required fields", { status: 400 });
  }

  // intent 분류 (placeholder)
  const intent = data.intent || "general";
  const slug = encodeURIComponent(
    data.title.replace(/\s+/g, "-").toLowerCase()
  );
  const now = new Date().toISOString();

  const jsonToSave = {
    ...data,
    intent,
    created_at: data.created_at || now,
  };

  // Supabase Storage 업로드
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/kuris-json/${intent}/${slug}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(jsonToSave),
    }
  );

  if (!res.ok) {
    return new Response("Storage upload failed", { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, path: `kuris-json/${intent}/${slug}.json` }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
