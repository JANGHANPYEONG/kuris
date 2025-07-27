"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const schema = z.object({
  details: z.string().optional(),
  links: z.array(z.string().url("올바른 URL을 입력해주세요")).optional(),
  files: z.any().optional(),
  retention: z.enum(["permanent", "temporary"]),
  expiry_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminUpload() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([""]);
  const router = useRouter();

  const retention = watch("retention");

  useEffect(() => {
    // 세션/권한 보호
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        console.log("Auth check:", { user: !!user, error: error?.message });

        if (error || !user) {
          console.log("No user, redirecting to login");
          router.replace("/admin/login");
          return;
        }

        // user_metadata에서 role 확인
        console.log("User metadata:", user.user_metadata);

        if (user.user_metadata?.role !== "admin") {
          console.log("Not admin, signing out and redirecting");
          await supabase.auth.signOut();
          router.replace("/admin/login");
        } else {
          console.log("Auth successful, user is admin");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage("");

    try {
      // FormData 준비
      const formData = new FormData();

      // 텍스트 내용 추가
      if (data.details) {
        formData.append("text", data.details);
      }

      // 링크 추가
      const validLinks = links.filter((link) => link.trim() !== "");
      if (validLinks.length > 0) {
        formData.append("link", validLinks[0]); // 첫 번째 링크만 사용
      }

      // 파일 추가
      if (selectedFiles.length > 0) {
        formData.append("file", selectedFiles[0]); // 첫 번째 파일만 사용
      }

      // 보관 기간 설정
      if (data.retention === "temporary" && data.expiry_date) {
        const expiryDate = new Date(data.expiry_date);
        const now = new Date();
        const retentionDays = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        formData.append("retentionDays", retentionDays.toString());
      }

      // 관리자 토큰 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      console.log(
        "Making API call with token:",
        session.access_token?.substring(0, 20) + "..."
      );

      // Edge Function 호출
      const response = await fetch("/api/admin/guidelines/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const result = await response.json();
      console.log("Response result:", result);

      if (!response.ok) {
        throw new Error(result.error || "업로드 실패");
      }

      setMessage("업로드 성공!");
      router.push("/admin");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(
        `업로드 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">지침 업로드</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽 절반 - 상세 내용 */}
          <div className="lg:col-span-2">
            <label className="block mb-1 font-medium">상세 내용</label>
            <textarea
              {...register("details")}
              className="w-full border px-3 py-2 rounded h-64 resize-none"
              placeholder="상세 내용을 입력해주세요"
            />
            {errors.details && (
              <p className="text-red-500 text-sm">{errors.details.message}</p>
            )}
          </div>

          {/* 오른쪽 절반 - 나머지 필드들 */}
          <div className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">링크</label>
              {links.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[index] = e.target.value;
                      setLinks(newLinks);
                    }}
                    className="flex-1 border px-3 py-2 rounded"
                    placeholder="https://example.com"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newLinks = links.filter((_, i) => i !== index);
                        setLinks(newLinks);
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks([...links, ""])}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                + 링크 추가
              </button>
            </div>

            <div>
              <label className="block mb-1 font-medium">파일 업로드</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
                className="w-full border px-3 py-2 rounded"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium mb-1">선택된 파일:</p>
                  <ul className="text-sm space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFiles(
                              selectedFiles.filter((_, i) => i !== index)
                            );
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">보관 기간 *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="permanent"
                    {...register("retention")}
                    className="mr-2"
                  />
                  영구적
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="temporary"
                    {...register("retention")}
                    className="mr-2"
                  />
                  기간 설정
                </label>
              </div>
              {errors.retention && (
                <p className="text-red-500 text-sm">
                  {errors.retention.message}
                </p>
              )}

              {retention === "temporary" && (
                <div className="mt-2">
                  <input
                    type="date"
                    {...register("expiry_date")}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 - 업로드 버튼 */}
        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "업로드 중..." : "업로드"}
          </button>
          {message && (
            <div className="text-center text-sm text-gray-600 mt-2">
              {message}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
