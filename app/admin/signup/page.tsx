"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  inviteCode: z.string().min(1, "인증코드를 입력하세요."),
});

type FormData = z.infer<typeof schema>;

export default function AdminSignup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage("");
    // 1. 인증코드 검증
    const verifyRes = await fetch(
      "https://rdcnivvbjzoyybdjedho.supabase.co/functions/v1/verifyAdminCode",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.inviteCode }),
      }
    );
    const verifyResult = await verifyRes.json();
    if (!verifyResult.valid) {
      setMessage("잘못된 인증코드입니다.");
      setLoading(false);
      return;
    }
    // 2. 회원가입 진행 (클라이언트에서 직접)
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { role: "admin" },
      },
    });
    if (error || !signUpData.user) {
      setMessage(error?.message || "회원가입 실패");
      setLoading(false);
      return;
    }
    // 3. 자동 로그인 및 권한 체크
    if (signUpData.user.user_metadata?.role !== "admin") {
      setMessage("관리자 권한이 없습니다.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setMessage("회원가입 성공! 이메일을 확인하세요.");
    setLoading(false);
    // router.replace("/admin"); // 필요시 자동 이동
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">관리자 회원가입</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">이메일</label>
          <input
            type="email"
            {...register("email")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">비밀번호</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">인증코드</label>
          <input
            type="text"
            {...register("inviteCode")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.inviteCode && (
            <p className="text-red-500 text-sm">{errors.inviteCode.message}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
        {message && (
          <div className="text-center text-sm text-gray-600 mt-2">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
