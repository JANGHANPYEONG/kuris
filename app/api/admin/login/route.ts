import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. Supabase signIn
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "로그인 실패" },
      { status: 401 }
    );
  }

  // 2. 관리자 권한(role=admin) 체크
  const role = data.user.user_metadata?.role;
  if (role !== "admin") {
    return NextResponse.json(
      { error: "관리자 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 3. 세션/유저 반환
  return NextResponse.json({ user: data.user, session: data.session });
}
