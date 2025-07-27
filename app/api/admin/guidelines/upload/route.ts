// /api/admin/guidelines/upload
// 관리자 지침 업로드 프록시 (Edge Function 호출)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log("=== Upload API called ===");

    // 관리자 인증 확인
    const authHeader = req.headers.get("authorization");
    console.log("Auth header:", authHeader ? "Present" : "Missing");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log("Auth result:", { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 사용자 role 확인 - user_metadata에서 확인
    if (user.user_metadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // FormData 파싱
    const formData = await req.formData();
    const text = formData.get("text") as string;
    const link = formData.get("link") as string;
    const file = formData.get("file") as File;
    const retentionDays =
      parseInt(formData.get("retentionDays") as string) || null;

    // 파일 처리
    let fileBase64: string | undefined;
    let filename: string | undefined;

    if (file) {
      const buffer = await file.arrayBuffer();
      fileBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      filename = file.name;
    }

    // Edge Function 호출
    const payload = {
      text: text || undefined,
      link: link || undefined,
      fileBase64,
      filename,
      retentionDays,
      uploadedBy: user.id, // 사용자 ID 전달
    };

    console.log("Calling Edge Function with payload:", {
      text: !!text,
      link: !!link,
      fileBase64: !!fileBase64,
      filename,
      retentionDays,
      uploadedBy: user.id,
    });

    const { data, error } = await supabase.functions.invoke(
      "ingest_guideline",
      {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    console.log("Edge Function response:", {
      data: !!data,
      error: error?.message,
    });

    if (error) {
      console.error("Edge Function error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
