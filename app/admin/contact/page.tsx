"use client";
import { useEffect, useState } from "react";
import { type Contact } from "@/lib/contacts";
import Link from "next/link";
import { useAdminData } from "@/lib/adminDataContext";

export default function ContactPage() {
  const { state, fetchContacts, updateContact, deleteContact } = useAdminData();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    position: "",
    instagram: "",
    kakao_id: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // 인증은 admin/layout.tsx에서 처리되므로 여기서는 제거
    // 캐시된 데이터가 있으면 사용, 없으면 새로 fetch
    if (state.contacts.length === 0) {
      fetchContacts();
    }
  }, [fetchContacts, state.contacts.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      if (editingId) {
        // 수정 - context의 updateContact 사용
        const contactToUpdate: Contact = {
          id: editingId,
          ...formData,
          created_at: new Date().toISOString(),
        };
        await updateContact(contactToUpdate);
        setEditingId(null);
      } else {
        // 새로 추가 - 직접 API 호출 (context에 addContact 함수가 없음)
        const response = await fetch("/api/admin/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "연락처 생성 실패");
        }

        // 새로 추가 후 목록 새로고침
        fetchContacts();
      }

      setFormData({
        name: "",
        name_en: "",
        position: "",
        instagram: "",
        kakao_id: "",
        phone: "",
      });
      setIsAdding(false);
    } catch (e) {
      console.error("Submit error:", e);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      name_en: contact.name_en || "",
      position: contact.position,
      instagram: contact.instagram,
      kakao_id: contact.kakao_id,
      phone: contact.phone,
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      // context의 deleteContact 사용
      await deleteContact(id);
    } catch (e) {
      console.error("Delete error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: "",
      name_en: "",
      position: "",
      instagram: "",
      kakao_id: "",
      phone: "",
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">운영진 연락처 관리</h1>
      </div>

      <Link
        href="/admin"
        className="inline-block mb-6 text-blue-600 hover:text-blue-800"
      >
        ← 대시보드로 돌아가기
      </Link>

      {state.loading.contacts ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : state.errors.contacts ? (
        <div className="text-red-600 py-8">{state.errors.contacts}</div>
      ) : (
        <div className="space-y-6">
          {/* 연락처 등록 폼 */}
          {isAdding && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? "연락처 수정" : "새 연락처 등록"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    영문 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData({ ...formData, name_en: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="영문 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직책
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">직책을 선택하세요</option>
                    <option value="회장">회장</option>
                    <option value="부회장">부회장</option>
                    <option value="기획부장">기획부장</option>
                    <option value="홍보부장">홍보부장</option>
                    <option value="조직부장">조직부장</option>
                    <option value="미디어부장">미디어부장</option>
                    <option value="총무부장">총무부장</option>
                    <option value="커뮤니케이션부장">커뮤니케이션부장</option>
                    <option value="1조 조장">1조 조장</option>
                    <option value="2조 조장">2조 조장</option>
                    <option value="3조 조장">3조 조장</option>
                    <option value="4조 조장">4조 조장</option>
                    <option value="5조 조장">5조 조장</option>
                    <option value="6조 조장">6조 조장</option>
                    <option value="7조 조장">7조 조장</option>
                    <option value="8조 조장">8조 조장</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인스타그램
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="인스타그램 계정명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카카오톡 ID
                  </label>
                  <input
                    type="text"
                    value={formData.kakao_id}
                    onChange={(e) =>
                      setFormData({ ...formData, kakao_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="카카오톡 ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="전화번호"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? "수정" : "등록"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 연락처 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                연락처 목록
              </h2>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  + 새 연락처 등록
                </button>
              )}
            </div>
            <div className="overflow-hidden">
              {state.contacts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  등록된 연락처가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {state.contacts.map((contact) => (
                    <div key={contact.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {contact.name}
                            </h3>
                            {contact.name_en && (
                              <span className="text-sm text-gray-600">
                                ({contact.name_en})
                              </span>
                            )}
                            {contact.position && (
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {contact.position}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            {contact.instagram && (
                              <p>📷 인스타그램: {contact.instagram}</p>
                            )}
                            {contact.kakao_id && (
                              <p>💬 카카오톡: {contact.kakao_id}</p>
                            )}
                            {contact.phone && (
                              <p>📞 전화번호: {contact.phone}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            등록일:{" "}
                            {new Date(contact.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(contact)}
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-red-600 hover:text-red-800 underline text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
