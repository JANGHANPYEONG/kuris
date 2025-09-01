import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성 (다른 admin API와 동일한 방식)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 설정 조회
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/admin/settings called");

    // 관리자 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Invalid token or auth error");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (user.user_metadata?.role !== "admin") {
      console.log("User is not admin");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("Admin authentication successful, proceeding with query");

    // settings 테이블에서 데이터 조회
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("key");

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "설정을 불러올 수 없습니다.", details: error.message },
        { status: 500 }
      );
    }

    console.log("Settings fetched:", data);

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    console.log("PUT /api/admin/settings called");

    // 관리자 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Invalid token or auth error");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (user.user_metadata?.role !== "admin") {
      console.log("User is not admin");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key와 value가 필요합니다." },
        { status: 400 }
      );
    }

    // match_threshold는 0.0 ~ 1.0 범위 검증
    if (key === "match_threshold") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 1) {
        return NextResponse.json(
          { error: "match_threshold는 0.0 ~ 1.0 사이의 값이어야 합니다." },
          { status: 400 }
        );
      }
    }

    console.log("Updating setting:", { key, value });

    // service_role 키를 사용하여 RLS 정책 우회
    const { data, error } = await supabase
      .from("settings")
      .update({ value: value.toString() })
      .eq("key", key)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json(
        { error: `설정 업데이트에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "설정이 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
