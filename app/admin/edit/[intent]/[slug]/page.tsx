"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

const schema = z.object({
  intent: z.string().min(1, "intent 필수"),
  slug: z.string().min(1, "slug 필수 (영문, -, _만 허용)"),
  title: z.string().min(1, "제목 필수"),
  summary: z.string().optional(),
  details: z.string().optional(),
  tags: z.string().optional(),
  original_input: z.string().min(1, "original_input 필수"),
});

type FormData = z.infer<typeof schema>;

export default function AdminEdit() {
  const router = useRouter();
  const params = useParams();
  const intent = Array.isArray(params.intent)
    ? params.intent[0]
    : params.intent;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
  }, [router]);

  useEffect(() => {
    if (intent && slug) {
      loadFile();
    }
    // eslint-disable-next-line
  }, [intent, slug]);

  const loadFile = async () => {
    setLoading(true);
    setMessage("");
    const filePath = `${intent}/${slug}.json`;
    const { data, error } = await supabase.storage
      .from("kuris-json")
      .download(filePath);
    if (error) {
      setMessage("파일 불러오기 실패: " + error.message);
      setLoading(false);
      return;
    }
    const text = await data.text();
    try {
      const json = JSON.parse(text);
      setValue("intent", json.intent || intent);
      setValue("slug", slug);
      setValue("title", json.title || "");
      setValue("summary", json.summary || "");
      setValue("details", json.details || "");
      setValue("tags", (json.tags || []).join(", "));
      setValue("original_input", json.original_input || "");
    } catch {
      setMessage("JSON 파싱 오류");
    }
    setLoading(false);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage("");
    const filePath = `${data.intent}/${data.slug}.json`;
    const json = {
      ...data,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.storage
      .from("kuris-json")
      .upload(filePath, JSON.stringify(json), {
        contentType: "application/json",
        upsert: true,
      });
    if (error) {
      setMessage("수정 실패: " + error.message);
    } else {
      setMessage("수정 성공!");
      router.push("/admin");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">지침 수정</h1>
      {loading ? (
        <div className="text-center">로딩 중...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Intent *</label>
            <input
              type="text"
              {...register("intent")}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.intent && (
              <p className="text-red-500 text-sm">{errors.intent.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Slug *</label>
            <input
              type="text"
              {...register("slug")}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm">{errors.slug.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">제목 *</label>
            <input
              type="text"
              {...register("title")}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">요약</label>
            <input
              type="text"
              {...register("summary")}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">상세 내용</label>
            <textarea
              {...register("details")}
              className="w-full border px-3 py-2 rounded h-24"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">태그 (쉼표로 구분)</label>
            <input
              type="text"
              {...register("tags")}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">original_input *</label>
            <textarea
              {...register("original_input")}
              className="w-full border px-3 py-2 rounded h-16"
            />
            {errors.original_input && (
              <p className="text-red-500 text-sm">
                {errors.original_input.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "수정 중..." : "수정"}
          </button>
          {message && (
            <div className="text-center text-sm text-gray-600 mt-2">
              {message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
