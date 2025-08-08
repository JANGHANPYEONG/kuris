"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  BotContent,
  TextData,
  ImageData,
  MapData,
  LinkData,
  LoadingData,
} from "./types";
import TypingText from "./TypingText";
import StreamingText from "./StreamingText";
import { useLanguage } from "./LanguageContext";
import { t } from "./translations";
// Blocks JSON 형식을 위한 타입 정의
interface Block {
  type: "text" | "link" | "image" | "map";
  text?: string;
  url?: string;
  title?: string;
  description?: string;
}

interface BotMessageProps {
  content:
    | string
    | BotContent
    | { blocks: Block[]; intent?: string }
    | { stream: ReadableStream<Uint8Array> };
  isTyping?: boolean;
}

export default function BotMessage({
  content,
  isTyping = false,
}: BotMessageProps) {
  const { language } = useLanguage();

  // 스트리밍인 경우
  if (typeof content === "object" && "stream" in content && content.stream) {
    return (
      <div className="w-full">
        <div className="text-gray-900 leading-relaxed">
          <StreamingText stream={content.stream} className="" />
        </div>
      </div>
    );
  }

  // 문자열인 경우 (기존 호환성)
  if (typeof content === "string") {
    return (
      <div className="w-full">
        <div className="text-gray-900 leading-relaxed">
          {isTyping ? (
            <TypingText text={content} speed={30} />
          ) : (
            <ReactMarkdown
              key={`markdown-string-${content.slice(0, 50)}`}
              components={{
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900">
                    {children}
                  </strong>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                p: ({ children }) => <p className="mb-2">{children}</p>,
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    );
  }

  // Blocks JSON 형식인 경우 (새로운 형식)
  if ("blocks" in content && Array.isArray(content.blocks)) {
    const blocks = content.blocks as Block[];

    // 타이핑 중일 때는 전체 텍스트를 하나로 합쳐서 처리
    if (isTyping) {
      const allText = blocks
        .filter((block) => block.type === "text" && block.text)
        .map((block) => block.text)
        .join("\n\n");

      return (
        <div className="w-full">
          <div className="text-gray-900 leading-relaxed">
            <TypingText text={allText} speed={30} />
          </div>
        </div>
      );
    }

    // 타이핑 완료 후에는 각 블록을 개별적으로 렌더링
    return (
      <div className="w-full space-y-2">
        {/* Blocks 렌더링 - 기존 로직 재사용 */}
        {blocks.map((block, index) => {
          switch (block.type) {
            case "text":
              return block.text ? (
                <div key={index} className="w-full">
                  <div className="text-gray-900 leading-relaxed">
                    <ReactMarkdown
                      key={`markdown-${index}-${block.text?.slice(0, 50)}`}
                      components={{
                        // 굵은 글씨 스타일링
                        strong: ({ children }) => (
                          <strong className="font-bold text-gray-900">
                            {children}
                          </strong>
                        ),
                        // 제목 스타일링
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-2">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-bold mb-1">
                            {children}
                          </h3>
                        ),
                        // 리스트 스타일링
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        // 문단 스타일링
                        p: ({ children }) => (
                          <p className="mb-2 text-gray-900">{children}</p>
                        ),
                        // 링크 스타일링
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {block.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : null;

            case "link":
              return block.url ? (
                <div key={index} className="w-full">
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <h4 className="font-medium text-blue-900 mb-1">
                      {block.title || block.url}
                    </h4>
                    {block.description && (
                      <p className="text-sm text-blue-700">
                        {block.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-500 mt-2">{block.url}</p>
                  </a>
                </div>
              ) : null;

            case "image":
              return block.url ? (
                <div key={index} className="w-full space-y-2">
                  <img
                    src={block.url}
                    alt={block.title || "이미지"}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                  {block.description && (
                    <p className="text-sm text-gray-600 italic">
                      {block.description}
                    </p>
                  )}
                </div>
              ) : null;

            case "map":
              return block.url ? (
                <div key={index} className="w-full space-y-2">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      📍 {block.title || "위치"}
                    </h4>
                    {block.description && (
                      <p className="text-sm text-gray-600">
                        {block.description}
                      </p>
                    )}
                    <a
                      href={block.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-600 hover:text-blue-800"
                    >
                      지도 보기 →
                    </a>
                  </div>
                </div>
              ) : null;

            default:
              return null;
          }
        })}
      </div>
    );
  }

  // BotContent 객체인 경우 (기존 형식)
  const { type, data } = content as BotContent;

  switch (type) {
    case "text":
      return (
        <div className="w-full">
          <div className="text-gray-900 leading-relaxed">
            {isTyping ? (
              <TypingText text={(data as TextData).text} speed={30} />
            ) : (
              <ReactMarkdown
                key={`markdown-botcontent-${(data as TextData).text.slice(
                  0,
                  50
                )}`}
                components={{
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">
                      {children}
                    </strong>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-bold mb-1">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  // 링크 스타일링
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {(data as TextData).text}
              </ReactMarkdown>
            )}
          </div>
        </div>
      );

    case "image":
      const imageData = data as ImageData;
      return (
        <div className="w-full space-y-2">
          <img
            src={imageData.url}
            alt={imageData.alt || "이미지"}
            className="max-w-full h-auto rounded-lg shadow-sm"
          />
          {imageData.caption && (
            <p className="text-sm text-gray-600 italic">{imageData.caption}</p>
          )}
        </div>
      );

    case "map":
      const mapData = data as MapData;
      return (
        <div className="w-full space-y-2">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              📍 {mapData.location}
            </h4>
            {mapData.coordinates && (
              <p className="text-sm text-gray-600">
                좌표: {mapData.coordinates.lat}, {mapData.coordinates.lng}
              </p>
            )}
          </div>
        </div>
      );

    case "link":
      const linkData = data as LinkData;
      return (
        <div className="w-full">
          <a
            href={linkData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <h4 className="font-medium text-blue-900 mb-1">{linkData.title}</h4>
            {linkData.description && (
              <p className="text-sm text-blue-700">{linkData.description}</p>
            )}
            <p className="text-xs text-blue-500 mt-2">{linkData.url}</p>
          </a>
        </div>
      );

    case "loading":
      const loadingData = data as LoadingData;
      return (
        <div className="w-full">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <p>{loadingData.message || t(language, "loading")}</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full">
          <div className="text-gray-900 leading-relaxed">
            {JSON.stringify(data)}
          </div>
        </div>
      );
  }
}
