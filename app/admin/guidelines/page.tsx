"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GuidelineRow {
  id: string;
  title: string;
  summary: string;
  original_type: string;
  original_ref: string;
  expires_at: string | null;
  created_at: string;
}

export default function GuidelinesPage() {
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
      // 세션에서 액세스 토큰 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      // API 엔드포인트에서 데이터 조회
      const response = await fetch("/api/admin/guidelines", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "데이터를 불러올 수 없습니다.");
      }

      const result = await response.json();
      console.log("API response:", result); // 디버깅용

      setGuidelines(result.data);
    } catch (e) {
      console.error("Fetch guidelines error:", e);
      setError(
        `지침 목록을 불러올 수 없습니다: ${
          e instanceof Error ? e.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: GuidelineRow) => {
    if (!confirm(`정말 삭제하시겠습니까? (${row.title})`)) return;

    try {
      // 세션에서 액세스 토큰 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      // API를 통해 삭제
      const response = await fetch("/api/admin/guidelines", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: row.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "삭제에 실패했습니다.");
      }

      // 성공적으로 삭제된 경우 목록에서 제거
      setGuidelines(guidelines.filter((g) => g.id !== row.id));
      alert("삭제되었습니다.");
    } catch (e) {
      console.error("Delete error:", e);
      alert(
        `삭제 중 오류가 발생했습니다: ${
          e instanceof Error ? e.message : "알 수 없는 오류"
        }`
      );
    }
  };

  const handleRefresh = () => {
    fetchGuidelines();
  };

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">지침 목록</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            새로고침
          </button>
          <Link
            href="/admin/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + 새 지침 업로드
          </Link>
        </div>
      </div>

      <Link
        href="/admin"
        className="inline-block mb-4 text-blue-600 hover:text-blue-800"
      >
        ← 대시보드로 돌아가기
      </Link>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">지침 목록을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">오류 발생</div>
          <div className="text-red-600 mt-1">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      ) : guidelines.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">
            업로드된 지침이 없습니다.
          </div>
          <div className="text-gray-400 text-sm">새 지침을 업로드해보세요.</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="p-4 bg-gray-50 border-b">
            <div className="text-sm text-gray-600">
              총 {guidelines.length}개의 지침이 있습니다.
            </div>
          </div>
          <table className="w-full text-sm" style={{ minWidth: "1400px" }}>
            <thead>
              <tr className="bg-gray-50">
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "200px" }}
                >
                  제목
                </th>
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "600px" }}
                >
                  요약
                </th>
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "100px" }}
                >
                  타입
                </th>
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "150px" }}
                >
                  만료일
                </th>
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "200px" }}
                >
                  생성일
                </th>
                <th
                  className="p-4 text-left font-semibold"
                  style={{ width: "100px" }}
                >
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {guidelines.map((row: GuidelineRow) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{row.title}</td>
                  <td className="p-4">
                    <div className="max-w-none break-words" title={row.summary}>
                      {row.summary}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        row.original_type === "text"
                          ? "bg-green-100 text-green-800"
                          : row.original_type === "link"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.original_type}
                    </span>
                  </td>
                  <td className="p-4">
                    {row.expires_at
                      ? new Date(row.expires_at).toLocaleDateString("ko-KR")
                      : "영구"}
                  </td>
                  <td className="p-4">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(row)}
                      className="text-red-600 hover:text-red-800 underline text-sm"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
