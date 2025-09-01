"use client";
import { useState } from "react";
import Image from "next/image";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow from "./_components/ChatWindow";
import { ChatMessage } from "./_components/types";
import ChatInput from "./_components/ChatInput";
import ContactList from "./_components/ContactList";

import { LanguageProvider } from "./_components/LanguageContext";
import { useLanguage } from "./_components/LanguageContext";
import { t } from "./_components/translations";

function ChatPageContent() {
  const [activeTab, setActiveTab] = useState<"chat" | "contacts">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language } = useLanguage();

  const handleSend = async (text: string) => {
    setMessages((msgs) => [...msgs, { role: "user", content: text }]);

    // 로딩 상태 추가
    setMessages((msgs) => [
      ...msgs,
      {
        role: "bot",
        content: {
          type: "loading",
          data: { message: t(language, "loading") },
        },
      },
    ]);

    try {
      // 스트리밍 API 호출
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson", // NDJSON 응답 요청
        },
        body: JSON.stringify({ question: text, language, stream: true }),
        cache: "no-store", // 캐시 방지
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "API 호출 실패");
      }

      // 스트리밍 응답인 경우
      if (response.body) {
        // 로딩 메시지를 스트리밍 메시지로 교체
        setMessages((msgs) => {
          const newMsgs = [...msgs];
          const lastIndex = newMsgs.length - 1;
          if (
            newMsgs[lastIndex]?.role === "bot" &&
            typeof newMsgs[lastIndex].content !== "string" &&
            "type" in newMsgs[lastIndex].content &&
            newMsgs[lastIndex].content.type === "loading"
          ) {
            newMsgs[lastIndex] = {
              role: "bot",
              content: { stream: response.body! }, // ✅ 여기서만 1회 스트림 소비
            };
          }
          return newMsgs;
        });
      } else {
        // 일반 JSON 응답인 경우 (fallback)
        const result = await response.json();

        // 로딩 메시지를 실제 답변으로 교체
        setMessages((msgs) => {
          const newMsgs = [...msgs];
          const lastIndex = newMsgs.length - 1;
          if (
            newMsgs[lastIndex]?.role === "bot" &&
            typeof newMsgs[lastIndex].content !== "string" &&
            "type" in newMsgs[lastIndex].content &&
            newMsgs[lastIndex].content.type === "loading"
          ) {
            // 새로운 blocks JSON 형식 처리
            if (result.blocks) {
              newMsgs[lastIndex] = {
                role: "bot",
                content: {
                  blocks: result.blocks,
                  intent: result.intent,
                },
              };
            } else {
              // 기존 형식 호환성 유지
              newMsgs[lastIndex] = {
                role: "bot",
                content: {
                  type: "text",
                  data: { text: result.answer || "답변을 생성할 수 없습니다." },
                },
              };
            }
          }
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("Chat API error:", error);

      // 에러 메시지로 교체
      setMessages((msgs) => {
        const newMsgs = [...msgs];
        const lastIndex = newMsgs.length - 1;
        const lastMessage = newMsgs[lastIndex];
        if (
          lastMessage?.role === "bot" &&
          typeof lastMessage.content !== "string" &&
          "type" in lastMessage.content &&
          (lastMessage.content as { type: string }).type === "loading"
        ) {
          newMsgs[lastIndex] = {
            role: "bot",
            content: {
              type: "text",
              data: {
                text: `${t(language, "error")} ${
                  error instanceof Error ? error.message : "알 수 없는 오류"
                }`,
              },
            },
          };
        }
        return newMsgs;
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* ───── 사이드바 오버레이 ───── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:static md:inset-auto">
          <ChatSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* ───── 헤더 영역 ───── */}
      <header className="fixed top-0 left-0 right-0 z-0 flex items-center h-16 px-4 bg-gray-50">
        {/* 사이드바 열기 버튼 (헤더 안) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="사이드바 열기"
            className="mr-4 bg-white text-kucrimson rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
          >
            {/* 햄버거 아이콘 */}
            <svg width="24" height="24" stroke="#DC143C" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <span className="text-2xl font-bold text-black select-none">
          KUris-o1
        </span>
      </header>

      {/* ───── 메인 영역 ───── */}
      <main className="flex-1 flex flex-col items-center w-full overflow-x-hidden pt-10">
        <div className="w-full max-w-2xl flex flex-col flex-1">
          {activeTab === "chat" && (
            <>
              {messages.length === 0 ? (
                // 초기 화면 - ChatGPT 스타일
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-4">
                      <Image
                        src="/kuris-real.png"
                        alt="KUris 캐릭터"
                        width={320}
                        height={320}
                        className="object-contain"
                      />
                      <p className="text-gray-600 text-xl hidden md:block">
                        {t(language, "welcome")}
                      </p>
                    </div>
                  </div>

                  {/* 중앙에 위치한 입력창 */}
                  <div className="w-full max-w-3xl">
                    <ChatInput
                      onSend={handleSend}
                      sidebarOffset={sidebarOpen}
                      isCentered={true}
                    />
                  </div>
                </div>
              ) : (
                // 일반 채팅 화면
                <>
                  <ChatWindow messages={messages} />
                  <ChatInput
                    onSend={handleSend}
                    sidebarOffset={sidebarOpen}
                    isCentered={false}
                  />
                </>
              )}
            </>
          )}
          {activeTab === "contacts" && <ContactList />}
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <LanguageProvider>
      <ChatPageContent />
    </LanguageProvider>
  );
}
