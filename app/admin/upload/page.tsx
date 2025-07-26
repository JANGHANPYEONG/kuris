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
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    });
  }, [router]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage("");

    // 파일 업로드 처리
    const fileUrls: string[] = [];
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("kuris-files")
          .upload(fileName, file);

        if (uploadError) {
          setMessage("파일 업로드 실패: " + uploadError.message);
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("kuris-files")
          .getPublicUrl(fileName);
        fileUrls.push(urlData.publicUrl);
      }
    }

    const json = {
      details: data.details || "",
      links: links.filter((link) => link.trim() !== ""),
      file_urls: fileUrls,
      retention: data.retention,
      expiry_date: data.retention === "temporary" ? data.expiry_date : null,
      created_at: new Date().toISOString(),
    };

    // 임시로 고정된 경로에 저장 (실제로는 더 나은 구조가 필요할 수 있음)
    const filePath = `uploads/${Date.now()}.json`;
    const { error } = await supabase.storage
      .from("kuris-json")
      .upload(filePath, JSON.stringify(json), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      setMessage("업로드 실패: " + error.message);
    } else {
      setMessage("업로드 성공!");
      router.push("/admin");
    }
    setLoading(false);
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
