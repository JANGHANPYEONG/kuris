// cleanup_expired Edge Function
// 만료된 guidelines → JSON + asset 삭제 후 row 삭제

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    // 현재 시간보다 이전에 만료된 guidelines 조회
    const { data: expiredGuidelines, error: fetchError } = await supabase
      .from("guidelines")
      .select("id, json_path, original_type, original_ref")
      .lt("expires_at", new Date().toISOString())
      .not("expires_at", "is", null);

    if (fetchError) {
      throw new Error(`Fetch expired guidelines error: ${fetchError.message}`);
    }

    if (!expiredGuidelines || expiredGuidelines.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "No expired guidelines found",
          cleaned: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let cleanedCount = 0;
    const errors = [];

    // 각 만료된 guideline에 대해 삭제 작업 수행
    for (const guideline of expiredGuidelines) {
      try {
        // 1. JSON 파일 삭제
        if (guideline.json_path) {
          const { error: jsonError } = await supabase.storage
            .from("kuris-json")
            .remove([guideline.json_path]);

          if (jsonError) {
            console.warn(
              `JSON deletion error for ${guideline.id}: ${jsonError.message}`
            );
          }
        }

        // 2. 원본 파일 삭제 (파일 타입인 경우)
        if (guideline.original_type === "file" && guideline.original_ref) {
          const { error: fileError } = await supabase.storage
            .from("kuris-assets")
            .remove([guideline.original_ref]);

          if (fileError) {
            console.warn(
              `File deletion error for ${guideline.id}: ${fileError.message}`
            );
          }
        }

        // 3. guidelines row 삭제
        const { error: deleteError } = await supabase
          .from("guidelines")
          .delete()
          .eq("id", guideline.id);

        if (deleteError) {
          throw new Error(`Row deletion error: ${deleteError.message}`);
        }

        cleanedCount++;
        console.log(`Cleaned expired guideline: ${guideline.id}`);
      } catch (error) {
        console.error(`Error cleaning guideline ${guideline.id}:`, error);
        errors.push({ id: guideline.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        cleaned: cleanedCount,
        total: expiredGuidelines.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("cleanup_expired error:", error);
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
