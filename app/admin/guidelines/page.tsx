"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/lib/adminDataContext";
import { useUpload } from "@/lib/uploadContext";

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
  const { state, fetchGuidelines, deleteGuideline } = useAdminData();
  const router = useRouter();
  const { addUpload } = useUpload();

  useEffect(() => {
    // 세션/권한 보호
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
    // 캐시된 데이터가 있으면 사용, 없으면 새로 fetch (대시보드에서 미리 로드했지만 혹시 모를 경우를 대비)
    if (state.guidelines.length === 0) {
      fetchGuidelines();
    }
  }, [fetchGuidelines, state.guidelines.length]);

  const handleDelete = async (row: GuidelineRow) => {
    if (!confirm(`정말 삭제하시겠습니까? (${row.title})`)) return;

    try {
      await deleteGuideline(row.id);
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
    fetchGuidelines(true); // 강제 새로고침
  };

  const handleUploadClick = () => {
    // 팝업에 업로드 항목 추가
    addUpload("새 지침 업로드");
    // 업로드 페이지로 이동
    router.push("/admin/upload");
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
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + 새 지침 업로드
          </button>
        </div>
      </div>

      <Link
        href="/admin"
        className="inline-block mb-4 text-blue-600 hover:text-blue-800"
      >
        ← 대시보드로 돌아가기
      </Link>

      {state.loading.guidelines ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">지침 목록을 불러오는 중...</p>
        </div>
      ) : state.errors.guidelines ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">오류 발생</div>
          <div className="text-red-600 mt-1">{state.errors.guidelines}</div>
          <button
            onClick={handleRefresh}
            className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      ) : state.guidelines.length === 0 ? (
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
              총 {state.guidelines.length}개의 지침이 있습니다.
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
              {state.guidelines.map((row: GuidelineRow) => (
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
