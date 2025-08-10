// Block 타입 정의
export interface Block {
  type: "text" | "link" | "image" | "map";
  text?: string;
  url?: string;
  title?: string;
  description?: string;
  details?: string;
}

// 채팅 메시지 타입 정의
export interface ChatMessage {
  role: "user" | "bot";
  content:
    | string
    | BotContent
    | { blocks: Block[]; intent?: string }
    | { stream: ReadableStream<Uint8Array> };
  isTyping?: boolean;
}

export interface BotContent {
  type: "text" | "image" | "map" | "link" | "loading";
  data: TextData | ImageData | MapData | LinkData | LoadingData;
}

// 각 콘텐츠 타입별 데이터 인터페이스
export interface TextData {
  text: string;
}

export interface ImageData {
  url: string;
  alt?: string;
  caption?: string;
}

export interface MapData {
  location: string;
  coordinates?: { lat: number; lng: number };
}

export interface LinkData {
  url: string;
  title: string;
  description?: string;
}

export interface LoadingData {
  message?: string;
}

// 언어 관련 타입 정의
export type Language = "en" | "ja" | "zh" | "ko";

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

// 번역 키 타입
export type TranslationKey =
  | "placeholder"
  | "sendButton"
  | "languageSettings"
  | "chat"
  | "contacts"
  | "map"
  | "executives"
  | "loading"
  | "error"
  | "welcome"
  | "helpMessage"
  | "naverMap"
  | "mapPlaceholder"
  | "footer"
  | "noContacts"
  // Positions
  | "president"
  | "vicePresident"
  | "planningDirector"
  | "publicityDirector"
  | "organizationDirector"
  | "mediaDirector"
  | "generalAffairsDirector"
  | "communicationDirector"
  | "team1Leader"
  | "team2Leader"
  | "team3Leader"
  | "team4Leader"
  | "team5Leader"
  | "team6Leader"
  | "team7Leader"
  | "team8Leader";

// 번역 데이터 타입
export type Translations = Record<TranslationKey, string>;
