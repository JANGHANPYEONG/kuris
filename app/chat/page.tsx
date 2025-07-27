"use client";
import { useState, useEffect } from "react";
import ChatSidebar from "./_components/ChatSidebar";
import ChatWindow from "./_components/ChatWindow";
import { ChatMessage } from "./_components/types";
import ChatInput from "./_components/ChatInput";
import ContactList from "./_components/ContactList";
import NaverMapBox from "./_components/NaverMapBox";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "contacts" | "map">(
    "chat"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = async (text: string) => {
    setMessages((msgs) => [...msgs, { role: "user", content: text }]);

    // 로딩 상태 추가
    setMessages((msgs) => [
      ...msgs,
      {
        role: "bot",
        content: {
          type: "loading",
          data: { message: "답변을 생성하고 있습니다..." },
        },
      },
    ]);

    try {
      // 실제 API 호출
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: text }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "API 호출 실패");
      }

      // 로딩 메시지를 실제 답변으로 교체
      setMessages((msgs) => {
        const newMsgs = [...msgs];
        const lastIndex = newMsgs.length - 1;
        if (
          newMsgs[lastIndex]?.role === "bot" &&
          typeof newMsgs[lastIndex].content !== "string" &&
          newMsgs[lastIndex].content.type === "loading"
        ) {
          newMsgs[lastIndex] = {
            role: "bot",
            content: {
              type: "text",
              data: { text: result.answer },
            },
          };
        }
        return newMsgs;
      });
    } catch (error) {
      console.error("Chat API error:", error);

      // 에러 메시지로 교체
      setMessages((msgs) => {
        const newMsgs = [...msgs];
        const lastIndex = newMsgs.length - 1;
        if (
          newMsgs[lastIndex]?.role === "bot" &&
          typeof newMsgs[lastIndex].content !== "string" &&
          newMsgs[lastIndex].content.type === "loading"
        ) {
          newMsgs[lastIndex] = {
            role: "bot",
            content: {
              type: "text",
              data: {
                text: `죄송합니다. 오류가 발생했습니다: ${
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
                      <img
                        src="/kuris.png"
                        alt="KUris 캐릭터"
                        className="w-80 h-80 object-contain"
                      />
                      <p className="text-gray-600 text-xl hidden md:block">
                        무엇을 도와드릴까요?
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
          {activeTab === "map" && <NaverMapBox />}
        </div>
      </main>
    </div>
  );
}
