import { supabase } from "./supabaseClient";

export interface Contact {
  id: string;
  name: string;
  name_en?: string;
  position: string;
  instagram: string;
  kakao_id: string;
  phone: string;
  created_at: string;
}

export interface CreateContactData {
  name: string;
  name_en?: string;
  position?: string;
  instagram?: string;
  kakao_id?: string;
  phone?: string;
}

export interface UpdateContactData extends CreateContactData {
  id: string;
}

// 연락처 목록 조회 (모든 사용자 가능)
export async function getContacts(): Promise<Contact[]> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getContacts:", error);
    throw error;
  }
}

// 새 연락처 생성 (관리자만)
export async function createContact(
  contactData: CreateContactData
): Promise<Contact> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .insert([contactData])
      .select();

    if (error) {
      console.error("Error creating contact:", error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error("Error in createContact:", error);
    throw error;
  }
}

// 연락처 수정 (관리자만)
export async function updateContact(
  contactData: UpdateContactData
): Promise<Contact> {
  try {
    const { id, ...updateData } = contactData;

    const { data, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating contact:", error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error("Error in updateContact:", error);
    throw error;
  }
}

// 연락처 삭제 (관리자만)
export async function deleteContact(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting contact:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteContact:", error);
    throw error;
  }
}

// Edge Function을 사용하는 대안 API 함수들
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Edge Function을 통한 연락처 목록 조회
export async function getContactsViaEdgeFunction(): Promise<Contact[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contacts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error in getContactsViaEdgeFunction:", error);
    throw error;
  }
}

// Edge Function을 통한 새 연락처 생성
export async function createContactViaEdgeFunction(
  contactData: CreateContactData
): Promise<Contact> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error in createContactViaEdgeFunction:", error);
    throw error;
  }
}

// Edge Function을 통한 연락처 수정
export async function updateContactViaEdgeFunction(
  contactData: UpdateContactData
): Promise<Contact> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/contacts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error in updateContactViaEdgeFunction:", error);
    throw error;
  }
}

// Edge Function을 통한 연락처 삭제
export async function deleteContactViaEdgeFunction(id: string): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/contacts?id=${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error in deleteContactViaEdgeFunction:", error);
    throw error;
  }
}
