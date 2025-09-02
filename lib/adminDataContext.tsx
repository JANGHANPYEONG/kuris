"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient";

// 타입 정의
interface Contact {
  id: string;
  name: string;
  name_en?: string;
  position: string;
  instagram: string;
  kakao_id: string;
  phone: string;
  created_at: string;
}

interface GuidelineRow {
  id: string;
  title: string;
  summary: string;
  original_type: string;
  original_ref: string;
  expires_at: string | null;
  created_at: string;
}

interface ChatLog {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface StatisticData {
  totalChats: number;
  totalGuidelines: number;
  recentChats: ChatLog[];
}

interface JsonFile {
  name: string;
  path: string;
  created_at: string;
}

interface SettingsData {
  match_threshold: string;
}

// 상태 타입
interface AdminDataState {
  contacts: Contact[];
  guidelines: GuidelineRow[];
  statistics: StatisticData;
  jsonFiles: JsonFile[];
  settings: SettingsData;
  loading: {
    contacts: boolean;
    guidelines: boolean;
    statistics: boolean;
    jsonFiles: boolean;
    settings: boolean;
  };
  errors: {
    contacts: string;
    guidelines: string;
    statistics: string;
    jsonFiles: string;
    settings: string;
  };
  lastUpdated: {
    contacts: number | null;
    guidelines: number | null;
    statistics: number | null;
    jsonFiles: number | null;
    settings: number | null;
  };
}

// 액션 타입
type AdminDataAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof AdminDataState["loading"]; loading: boolean };
    }
  | {
      type: "SET_ERROR";
      payload: { key: keyof AdminDataState["errors"]; error: string };
    }
  | { type: "SET_CONTACTS"; payload: Contact[] }
  | { type: "SET_GUIDELINES"; payload: GuidelineRow[] }
  | { type: "SET_STATISTICS"; payload: StatisticData }
  | { type: "SET_JSON_FILES"; payload: JsonFile[] }
  | { type: "SET_SETTINGS"; payload: SettingsData }
  | { type: "UPDATE_CONTACT"; payload: Contact }
  | { type: "DELETE_CONTACT"; payload: string }
  | { type: "DELETE_GUIDELINE"; payload: string }
  | { type: "CLEAR_ERROR"; payload: keyof AdminDataState["errors"] };

// 초기 상태
const initialState: AdminDataState = {
  contacts: [],
  guidelines: [],
  statistics: {
    totalChats: 0,
    totalGuidelines: 0,
    recentChats: [],
  },
  jsonFiles: [],
  settings: {
    match_threshold: "0.28",
  },
  loading: {
    contacts: false,
    guidelines: false,
    statistics: false,
    jsonFiles: false,
    settings: false,
  },
  errors: {
    contacts: "",
    guidelines: "",
    statistics: "",
    jsonFiles: "",
    settings: "",
  },
  lastUpdated: {
    contacts: null,
    guidelines: null,
    statistics: null,
    jsonFiles: null,
    settings: null,
  },
};

// 리듀서
function adminDataReducer(
  state: AdminDataState,
  action: AdminDataAction
): AdminDataState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };
    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };
    case "SET_CONTACTS":
      return {
        ...state,
        contacts: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          contacts: Date.now(),
        },
      };
    case "SET_GUIDELINES":
      return {
        ...state,
        guidelines: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          guidelines: Date.now(),
        },
      };
    case "SET_STATISTICS":
      return {
        ...state,
        statistics: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          statistics: Date.now(),
        },
      };
    case "SET_JSON_FILES":
      return {
        ...state,
        jsonFiles: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          jsonFiles: Date.now(),
        },
      };
    case "SET_SETTINGS":
      return {
        ...state,
        settings: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          settings: Date.now(),
        },
      };
    case "UPDATE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((contact) =>
          contact.id === action.payload.id ? action.payload : contact
        ),
        lastUpdated: {
          ...state.lastUpdated,
          contacts: Date.now(),
        },
      };
    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter(
          (contact) => contact.id !== action.payload
        ),
        lastUpdated: {
          ...state.lastUpdated,
          contacts: Date.now(),
        },
      };
    case "DELETE_GUIDELINE":
      return {
        ...state,
        guidelines: state.guidelines.filter(
          (guideline) => guideline.id !== action.payload
        ),
        lastUpdated: {
          ...state.lastUpdated,
          guidelines: Date.now(),
        },
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: "",
        },
      };
    default:
      return state;
  }
}

// Context 생성
const AdminDataContext = createContext<{
  state: AdminDataState;
  dispatch: React.Dispatch<AdminDataAction>;
  fetchContacts: (force?: boolean) => Promise<void>;
  fetchGuidelines: (force?: boolean) => Promise<void>;
  fetchStatistics: (force?: boolean) => Promise<void>;
  fetchJsonFiles: (force?: boolean) => Promise<void>;
  fetchSettings: (force?: boolean) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  deleteGuideline: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<SettingsData>) => Promise<void>;
} | null>(null);

// 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

// Provider 컴포넌트
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminDataReducer, initialState);

  // 인증 토큰 가져오기
  const getAuthToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("인증 토큰이 없습니다.");
    }
    return session.access_token;
  };

  // 캐시 유효성 검사
  const isCacheValid = (key: keyof AdminDataState["lastUpdated"]) => {
    const lastUpdated = state.lastUpdated[key];
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_DURATION;
  };

  // 연락처 데이터 가져오기
  const fetchContacts = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("contacts") && state.contacts.length > 0) {
        return;
      }

      dispatch({
        type: "SET_LOADING",
        payload: { key: "contacts", loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: "contacts" });

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/admin/contacts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "연락처 목록을 불러올 수 없습니다."
          );
        }

        const data = await response.json();
        dispatch({ type: "SET_CONTACTS", payload: data });
      } catch (error) {
        console.error("Fetch contacts error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "contacts",
            error:
              error instanceof Error
                ? error.message
                : "연락처 목록을 불러올 수 없습니다.",
          },
        });
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "contacts", loading: false },
        });
      }
    },
    [state.contacts.length, state.lastUpdated.contacts]
  );

  // 지침 데이터 가져오기
  const fetchGuidelines = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("guidelines") && state.guidelines.length > 0) {
        return;
      }

      dispatch({
        type: "SET_LOADING",
        payload: { key: "guidelines", loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: "guidelines" });

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/admin/guidelines", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "지침 목록을 불러올 수 없습니다.");
        }

        const result = await response.json();
        dispatch({ type: "SET_GUIDELINES", payload: result.data });
      } catch (error) {
        console.error("Fetch guidelines error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "guidelines",
            error:
              error instanceof Error
                ? error.message
                : "지침 목록을 불러올 수 없습니다.",
          },
        });
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "guidelines", loading: false },
        });
      }
    },
    [state.guidelines.length, state.lastUpdated.guidelines]
  );

  // 통계 데이터 가져오기
  const fetchStatistics = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("statistics")) {
        return;
      }

      dispatch({
        type: "SET_LOADING",
        payload: { key: "statistics", loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: "statistics" });

      try {
        // 채팅 로그 수 조회
        const { count: chatCount, error: chatError } = await supabase
          .from("chat_logs")
          .select("*", { count: "exact", head: true });

        if (chatError) throw chatError;

        // 지침 수 조회
        const { count: guidelineCount, error: guidelineError } = await supabase
          .from("guidelines")
          .select("*", { count: "exact", head: true });

        if (guidelineError) throw guidelineError;

        // 최근 채팅 로그 조회
        const { data: recentChats, error: recentChatsError } = await supabase
          .from("chat_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentChatsError) throw recentChatsError;

        const statistics: StatisticData = {
          totalChats: chatCount || 0,
          totalGuidelines: guidelineCount || 0,
          recentChats: recentChats || [],
        };

        dispatch({ type: "SET_STATISTICS", payload: statistics });
      } catch (error) {
        console.error("Fetch statistics error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "statistics",
            error:
              error instanceof Error
                ? error.message
                : "통계를 불러올 수 없습니다.",
          },
        });
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "statistics", loading: false },
        });
      }
    },
    [state.lastUpdated.statistics]
  );

  // JSON 파일 목록 가져오기
  const fetchJsonFiles = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("jsonFiles") && state.jsonFiles.length > 0) {
        return;
      }

      dispatch({
        type: "SET_LOADING",
        payload: { key: "jsonFiles", loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: "jsonFiles" });

      try {
        const { data, error } = await supabase.storage
          .from("kuris-json")
          .list("", { limit: 100 });

        if (error) throw error;

        const files: JsonFile[] = (data || []).map((file) => ({
          name: file.name,
          path: file.name,
          created_at: file.created_at || "",
        }));

        dispatch({ type: "SET_JSON_FILES", payload: files });
      } catch (error) {
        console.error("Fetch JSON files error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "jsonFiles",
            error:
              error instanceof Error
                ? error.message
                : "파일 목록을 불러올 수 없습니다.",
          },
        });
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "jsonFiles", loading: false },
        });
      }
    },
    [state.jsonFiles.length, state.lastUpdated.jsonFiles]
  );

  // 설정 데이터 가져오기
  const fetchSettings = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("settings")) {
        return;
      }

      dispatch({
        type: "SET_LOADING",
        payload: { key: "settings", loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: "settings" });

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/admin/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "설정을 불러올 수 없습니다.");
        }

        const result = await response.json();
        const matchThresholdSetting = result.data.find(
          (setting: { key: string; value: string }) =>
            setting.key === "match_threshold"
        );

        const settings: SettingsData = {
          match_threshold: matchThresholdSetting?.value || "0.28",
        };

        dispatch({ type: "SET_SETTINGS", payload: settings });
      } catch (error) {
        console.error("Fetch settings error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "settings",
            error:
              error instanceof Error
                ? error.message
                : "설정을 불러올 수 없습니다.",
          },
        });
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "settings", loading: false },
        });
      }
    },
    [state.lastUpdated.settings]
  );

  // 연락처 업데이트
  const updateContact = useCallback(async (contact: Contact) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/admin/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "연락처 수정 실패");
      }

      dispatch({ type: "UPDATE_CONTACT", payload: contact });
    } catch (error) {
      console.error("Update contact error:", error);
      throw error;
    }
  }, []);

  // 연락처 삭제
  const deleteContact = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/admin/contacts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "연락처 삭제 실패");
      }

      dispatch({ type: "DELETE_CONTACT", payload: id });
    } catch (error) {
      console.error("Delete contact error:", error);
      throw error;
    }
  }, []);

  // 지침 삭제
  const deleteGuideline = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/admin/guidelines", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "삭제에 실패했습니다.");
      }

      dispatch({ type: "DELETE_GUIDELINE", payload: id });
    } catch (error) {
      console.error("Delete guideline error:", error);
      throw error;
    }
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback(
    async (settings: Partial<SettingsData>) => {
      try {
        const token = await getAuthToken();

        // match_threshold 업데이트
        if (settings.match_threshold !== undefined) {
          const response = await fetch("/api/admin/settings", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: "match_threshold",
              value: settings.match_threshold,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "설정 업데이트에 실패했습니다.");
          }
        }

        // 로컬 상태 업데이트
        dispatch({
          type: "SET_SETTINGS",
          payload: { ...state.settings, ...settings },
        });
      } catch (error) {
        console.error("Update settings error:", error);
        throw error;
      }
    },
    [state.settings]
  );

  const value = {
    state,
    dispatch,
    fetchContacts,
    fetchGuidelines,
    fetchStatistics,
    fetchJsonFiles,
    fetchSettings,
    updateContact,
    deleteContact,
    deleteGuideline,
    updateSettings,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

// Hook
export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
}
