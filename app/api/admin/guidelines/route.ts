import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성 (contacts API와 동일한 방식)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/admin/guidelines called");

    // 관리자 인증 확인 (contacts API와 동일한 방식)
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

    // guidelines 테이블에서 데이터 조회
    const { data, error } = await supabase
      .from("guidelines")
      .select(
        `
        id,
        title,
        summary,
        original_type,
        original_ref,
        expires_at,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "데이터를 불러올 수 없습니다.", details: error.message },
        { status: 500 }
      );
    }

    console.log("Supabase query successful, data count:", data?.length || 0);

    // 데이터 가공
    const guidelines =
      data?.map((item) => ({
        id: item.id,
        title: item.title || "제목 없음",
        summary: item.summary || "",
        original_type: item.original_type || "text",
        original_ref: item.original_ref || "",
        expires_at: item.expires_at,
        created_at: item.created_at,
      })) || [];

    console.log("Processed guidelines count:", guidelines.length);

    return NextResponse.json({
      success: true,
      data: guidelines,
      count: guidelines.length,
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

export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인 (contacts API와 동일한 방식)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (user.user_metadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "삭제할 지침 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("guidelines").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "지침이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
