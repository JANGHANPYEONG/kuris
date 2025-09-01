import { Language, LanguageOption, Translations } from "./types";

// 언어 옵션 정의 (한국어와 영어만 지원)
export const LANGUAGES: LanguageOption[] = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

// 번역 데이터
export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    placeholder: "Ask me anything",
    sendButton: "Send",
    languageSettings: "Language Settings",
    chat: "Chat",
    contacts: "Executives",
    map: "Map",
    executives: "Executive Contacts",
    loading: "Generating response...",
    error: "Sorry, an error occurred:",
    welcome: "What can I help you with?",
    helpMessage: "How can I assist you?",
    naverMap: "Naver Map",
    mapPlaceholder: "Naver map will be displayed here.",
    footer: "© KUris 2025",
    noContacts: "No contacts available",
    // Positions
    president: "President",
    vicePresident: "Vice President",
    planningDirector: "Project Manager",
    publicityDirector: "Promotion Manager",
    organizationDirector: "HR Manager",
    mediaDirector: "Media Manager",
    generalAffairsDirector: "Finance Manager",
    communicationDirector: "Communication Manager ",
    team1Leader: "Group 1 Leader",
    team2Leader: "Group 2 Leader",
    team3Leader: "Group 3 Leader",
    team4Leader: "Group 4 Leader",
    team5Leader: "Group 5 Leader",
    team6Leader: "Group 6 Leader",
    team7Leader: "Group 7 Leader",
    team8Leader: "Group 8 Leader",
  },
  ko: {
    placeholder: "무엇이든 물어보세요",
    sendButton: "전송",
    languageSettings: "언어 설정",
    chat: "채팅",
    contacts: "임원진",
    map: "지도",
    executives: "임원진 연락처",
    loading: "답변을 생성하고 있습니다...",
    error: "죄송합니다. 오류가 발생했습니다:",
    welcome: "무엇을 도와드릴까요?",
    helpMessage: "어떻게 도와드릴까요?",
    naverMap: "네이버맵",
    mapPlaceholder: "여기에 네이버맵이 표시됩니다.",
    footer: "© KUris 2025",
    noContacts: "등록된 연락처가 없습니다",
    // Positions
    president: "회장",
    vicePresident: "부회장",
    planningDirector: "기획부장",
    publicityDirector: "홍보부장",
    organizationDirector: "조직부장",
    mediaDirector: "미디어부장",
    generalAffairsDirector: "총무부장",
    communicationDirector: "커뮤니케이션부장",
    team1Leader: "1조 조장",
    team2Leader: "2조 조장",
    team3Leader: "3조 조장",
    team4Leader: "4조 조장",
    team5Leader: "5조 조장",
    team6Leader: "6조 조장",
    team7Leader: "7조 조장",
    team8Leader: "8조 조장",
  },
};

// 번역 함수
export function t(lang: Language, key: keyof Translations): string {
  return TRANSLATIONS[lang][key] || key;
}
