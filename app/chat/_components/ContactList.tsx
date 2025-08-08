import React, { useState, useEffect } from "react";
import ContactCard from "./ContactCard";
import { useLanguage } from "./LanguageContext";
import { t } from "./translations";
import { getContacts, type Contact } from "@/lib/contacts";

export default function ContactList() {
  const { language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await getContacts();
        setContacts(data);
      } catch (e) {
        console.error("Error fetching contacts:", e);
        setError("연락처를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          {t(language, "executives")}
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t(language, "loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          {t(language, "executives")}
        </h2>
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {t(language, "executives")}
      </h2>
      {contacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t(language, "noContacts")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              position={contact.position}
              name={contact.name}
              name_en={contact.name_en}
              phone={contact.phone}
              instagram={contact.instagram}
              kakao={contact.kakao_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
