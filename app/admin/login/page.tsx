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
});

type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
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
    // 클라이언트에서 직접 로그인
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error || !loginData.user) {
      setMessage(error?.message || "로그인 실패");
      setLoading(false);
      return;
    }
    // 관리자 권한 체크 - user_metadata에서 확인
    if (loginData.user.user_metadata?.role !== "admin") {
      setMessage("관리자 권한이 없습니다.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    router.replace("/admin");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">관리자 로그인</h1>
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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {message && (
          <div className="text-center text-sm text-gray-600 mt-2">
            {message}
          </div>
        )}
      </form>
      <div className="mt-4 text-center">
        <a href="/admin/signup" className="text-blue-600 underline">
          회원가입
        </a>
      </div>
    </div>
  );
}
