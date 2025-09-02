"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getContacts, type Contact } from "@/lib/contacts";

interface ContactContextType {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

interface ContactProviderProps {
  children: ReactNode;
}

export function ContactProvider({ children }: ContactProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContacts();
      setContacts(data);
    } catch (e) {
      console.error("Error fetching contacts:", e);
      setError("연락처를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 즉시 연락처 로딩
  useEffect(() => {
    fetchContacts();
  }, []);

  const value: ContactContextType = {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
  };

  return (
    <ContactContext.Provider value={value}>{children}</ContactContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error("useContacts must be used within a ContactProvider");
  }
  return context;
}
