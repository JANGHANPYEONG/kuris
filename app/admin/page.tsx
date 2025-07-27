"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GuidelineRow {
  id: string;
  intent: string;
  title: string;
  summary: string;
  original_type: string;
  original_ref: string;
  expires_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [guidelines, setGuidelines] = useState<GuidelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    setLoading(true);
    setError("");
    try {
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
          created_at,
          intents!inner(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const guidelinesWithIntent =
        data?.map((item) => ({
          id: item.id,
          intent: (item.intents as any)?.name || "unknown",
          title: item.title || "제목 없음",
          summary: item.summary || "",
          original_type: item.original_type || "text",
          original_ref: item.original_ref || "",
          expires_at: item.expires_at,
          created_at: item.created_at,
        })) || [];

      setGuidelines(guidelinesWithIntent);
    } catch (e) {
      console.error("Fetch guidelines error:", e);
      setError("지침 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: GuidelineRow) => {
    if (!confirm(`정말 삭제하시겠습니까? (${row.title})`)) return;

    try {
      // guidelines row 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
      const { error } = await supabase
        .from("guidelines")
        .delete()
        .eq("id", row.id);

      if (error) {
        alert("삭제 실패: " + error.message);
      } else {
        setGuidelines(guidelines.filter((g) => g.id !== row.id));
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">관리자 콘솔 - 지침 목록</h1>
      <Link
        href="/admin/upload"
        className="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        + 새 지침 업로드
      </Link>
      {loading ? (
        <div className="text-center">로딩 중...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : guidelines.length === 0 ? (
        <div className="text-gray-500">업로드된 지침이 없습니다.</div>
      ) : (
        <table className="w-full border mt-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Intent</th>
              <th className="p-2">제목</th>
              <th className="p-2">요약</th>
              <th className="p-2">타입</th>
              <th className="p-2">만료일</th>
              <th className="p-2">생성일</th>
              <th className="p-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {guidelines.map((row: GuidelineRow) => (
              <tr key={row.id} className="border-b">
                <td className="p-2">{row.intent}</td>
                <td className="p-2">{row.title}</td>
                <td className="p-2 max-w-xs truncate">{row.summary}</td>
                <td className="p-2">{row.original_type}</td>
                <td className="p-2">
                  {row.expires_at
                    ? new Date(row.expires_at).toLocaleDateString()
                    : "영구"}
                </td>
                <td className="p-2">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(row)}
                    className="text-red-600 underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
