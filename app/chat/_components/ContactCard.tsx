import React from "react";
import { useLanguage } from "./LanguageContext";
import { t } from "./translations";

interface ContactCardProps {
  position: string;
  name: string;
  name_en?: string;
  phone: string;
  instagram?: string;
  kakao?: string;
}

export default function ContactCard({
  position,
  name,
  name_en,
  phone,
  instagram,
  kakao,
}: ContactCardProps) {
  const { language } = useLanguage();

  // 직책을 번역 키로 변환하는 함수
  const getPositionTranslationKey = (position: string): string => {
    const positionMap: Record<string, string> = {
      회장: "president",
      부회장: "vicePresident",
      기획부장: "projectManager",
      홍보부장: "promotionManager",
      조직부장: "hrManager",
      미디어부장: "mediaManager",
      총무부장: "financeManager",
      커뮤니케이션부장: "communicationManager",
      "1조 조장": "group1Leader",
      "2조 조장": "group2Leader",
      "3조 조장": "group3Leader",
      "4조 조장": "group4Leader",
      "5조 조장": "group5Leader",
      "6조 조장": "group6Leader",
      "7조 조장": "group7Leader",
      "8조 조장": "group8Leader",
    };
    return positionMap[position] || position;
  };

  const translatedPosition = t(
    language,
    getPositionTranslationKey(position) as keyof import("./types").Translations
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {translatedPosition}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-gray-800 font-medium">{name}</p>
              {name_en && (
                <span className="text-sm text-gray-500">({name_en})</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {phone && (
              <div className="flex items-center text-gray-700">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <span className="text-sm">{phone}</span>
              </div>
            )}

            {instagram && (
              <div className="flex items-center text-gray-700">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="text-sm">{instagram}</span>
              </div>
            )}

            {kakao && (
              <div className="flex items-center text-gray-700">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3C7.03 3 3 6.14 3 10c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h1v-3.5c0-.55.45-1 1-1s1 .45 1 1V17h1c.55 0 1-.45 1-1v-1.26c1.81-1.27 3-3.36 3-5.74 0-3.86-4.03-7-9-7z" />
                </svg>
                <span className="text-sm">{kakao}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
