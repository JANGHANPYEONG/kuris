"use client";
import React from "react";
import {
  BotContent,
  TextData,
  ImageData,
  MapData,
  LinkData,
  LoadingData,
} from "./types";

interface BotMessageProps {
  content: string | BotContent;
}

export default function BotMessage({ content }: BotMessageProps) {
  // 문자열인 경우 (기존 호환성)
  if (typeof content === "string") {
    return (
      <div className="w-full">
        <div className="text-gray-900 leading-relaxed">{content}</div>
      </div>
    );
  }

  // BotContent 객체인 경우
  const { type, data } = content;

  switch (type) {
    case "text":
      return (
        <div className="w-full">
          <div className="text-gray-900 leading-relaxed">
            {(data as TextData).text}
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
            <p>{loadingData.message || "답변을 생성하고 있습니다..."}</p>
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
