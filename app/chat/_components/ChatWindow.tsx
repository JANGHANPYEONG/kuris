"use client";
import React, { useRef, useEffect } from "react";
import BotMessage from "./BotMessage";
import { ChatMessage, TextData } from "./types";

export type { ChatMessage };

export default function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* 새 메시지마다 하단으로 스크롤 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="flex flex-col gap-4 px-6 py-6 pb-24">
      {messages.map((msg, i) => (
        <div key={i} className="w-full">
          {msg.role === "user" ? (
            // User 메시지 - 말풍선 스타일 유지
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl px-4 py-2 shadow bg-kucrimson text-white">
                {typeof msg.content === "string"
                  ? msg.content
                  : (msg.content.data as TextData).text}
              </div>
            </div>
          ) : (
            // Bot 메시지 - 말풍선 없이 BotMessage 컴포넌트 사용
            <BotMessage content={msg.content} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </section>
  );
}
