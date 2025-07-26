"use client";
import React, { useRef, useEffect } from "react";

export interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

export default function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* 새 메시지마다 하단으로 스크롤 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="flex flex-col gap-4 px-6 py-6 pb-24">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`max-w-[80%] rounded-xl px-4 py-2 shadow
            ${
              msg.role === "user"
                ? "self-end bg-kucrimson text-white"
                : "self-start bg-white text-gray-900"
            }`}
        >
          {msg.content}
        </div>
      ))}
      <div ref={bottomRef} />
    </section>
  );
}
