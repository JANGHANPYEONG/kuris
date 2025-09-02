"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminData } from "@/lib/adminDataContext";

interface JsonFile {
  name: string;
  path: string;
  created_at: string;
}

export default function AdminList() {
  const { state, fetchJsonFiles } = useAdminData();

  useEffect(() => {
    // 캐시된 데이터가 있으면 사용, 없으면 새로 fetch (대시보드에서 미리 로드했지만 혹시 모를 경우를 대비)
    if (state.jsonFiles.length === 0) {
      fetchJsonFiles();
    }
  }, [fetchJsonFiles, state.jsonFiles.length]);

  const groupByIntent = (files: JsonFile[]) => {
    const groups: Record<string, JsonFile[]> = {};
    files.forEach((file) => {
      const intent = file.name.split("/")[0] || "general";
      if (!groups[intent]) groups[intent] = [];
      groups[intent].push(file);
    });
    return groups;
  };

  if (state.loading.jsonFiles)
    return <div className="text-center">로딩 중...</div>;
  if (state.errors.jsonFiles)
    return <div className="text-red-600">{state.errors.jsonFiles}</div>;

  const groupedFiles = groupByIntent(state.jsonFiles);

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
