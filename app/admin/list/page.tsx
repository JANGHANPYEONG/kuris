"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface JsonFile {
  name: string;
  path: string;
  created_at: string;
}

export default function AdminList() {
  const [files, setFiles] = useState<JsonFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("kuris-json")
        .list("", { limit: 100 });

      if (error) throw error;
      // FileObject[] -> JsonFile[] 변환
      const files: JsonFile[] = (data || []).map((file) => ({
        name: file.name,
        path: file.name,
        created_at: file.created_at || "",
      }));
      setFiles(files);
    } catch (err) {
      setError("파일 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const groupByIntent = (files: JsonFile[]) => {
    const groups: Record<string, JsonFile[]> = {};
    files.forEach((file) => {
      const intent = file.name.split("/")[0] || "general";
      if (!groups[intent]) groups[intent] = [];
      groups[intent].push(file);
    });
    return groups;
  };

  if (loading) return <div className="text-center">로딩 중...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const groupedFiles = groupByIntent(files);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">JSON 목록</h1>
      {Object.entries(groupedFiles).map(([intent, intentFiles]) => (
        <div key={intent} className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">{intent}</h2>
          <ul className="space-y-1">
            {intentFiles.map((file) => (
              <li key={file.name} className="flex justify-between items-center">
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {Object.keys(groupedFiles).length === 0 && (
        <p className="text-gray-500">업로드된 파일이 없습니다.</p>
      )}
    </div>
  );
}
