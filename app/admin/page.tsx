"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FileRow {
  intent: string;
  slug: string;
  path: string;
  created_at: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
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
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      // List all intents (folders)
      const { data: intents, error: err1 } = await supabase.storage
        .from("kuris-json")
        .list("");
      if (err1) throw err1;
      const allFiles: FileRow[] = [];
      for (const intentFolder of intents || []) {
        if (intentFolder.name) {
          const { data: files, error: err2 } = await supabase.storage
            .from("kuris-json")
            .list(intentFolder.name);
          if (err2) continue;
          for (const file of files || []) {
            if (file.name.endsWith(".json")) {
              allFiles.push({
                intent: intentFolder.name,
                slug: file.name.replace(/\.json$/, ""),
                path: `${intentFolder.name}/${file.name}`,
                created_at: file.created_at || "",
              });
            }
          }
        }
      }
      setFiles(allFiles);
    } catch (e) {
      setError("지침 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: FileRow) => {
    if (!confirm(`정말 삭제하시겠습니까? (${row.path})`)) return;
    const { error } = await supabase.storage
      .from("kuris-json")
      .remove([row.path]);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      setFiles(files.filter((f) => f.path !== row.path));
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
      ) : files.length === 0 ? (
        <div className="text-gray-500">업로드된 지침이 없습니다.</div>
      ) : (
        <table className="w-full border mt-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Intent</th>
              <th className="p-2">Slug</th>
              <th className="p-2">생성일</th>
              <th className="p-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {files.map((row) => (
              <tr key={row.path} className="border-b">
                <td className="p-2">{row.intent}</td>
                <td className="p-2">{row.slug}</td>
                <td className="p-2">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2 flex gap-2">
                  <Link
                    href={`/admin/edit/${row.intent}/${row.slug}`}
                    className="text-blue-600 underline"
                  >
                    수정
                  </Link>
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
