"use client";

import { useState, useEffect } from "react";
import { Phone, MessageCircle, Video, MoreVertical, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/useTranslations";
import { useRouter } from "next/navigation"; // ✅ CORRECTO para App Router

interface Contact {
  id: string;
  name: string;
  status: "online" | "away" | "offline";
  lastMessage?: string;
  avatar: string;
  isVerified?: boolean;
  hasNewMessage?: boolean;
}

interface ContactsSidebarProps {
  currentContact: string | null;
  onContactSelect: (contact: string) => void;
  onViewChange: (view: "video-call" | "chat" | "screen-share") => void;
  currentView: string;
  contacts?: Contact[];
  currentUser?: string;
  // ✅ Ya no necesitamos onBackToDashboard como prop — lo manejamos internamente
}

export function ContactsSidebar({
  currentContact,
  onContactSelect,
  onViewChange,
  currentView,
  contacts = [],
  currentUser = "Tú",
}: ContactsSidebarProps) {
  const router = useRouter(); // ✅ Correcto en App Router
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const [enhancedContacts, setEnhancedContacts] = useState<Contact[]>([]);

  // ✅ Función interna — no depende de props
  const handleBackToDashboard = () => {
    router.push("/dashboard/index_dashboard"); 
  };

  useEffect(() => {
    const simulated = contacts.map((contact, index) => ({
      ...contact,
      hasNewMessage: index === 0 && contact.name !== currentContact,
    }));
    setEnhancedContacts(simulated);
  }, [contacts, currentContact]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredContacts = enhancedContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#0f0f0f] border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* ✅ Flecha visible y funcional — usa handleBackToDashboard directamente */}
            <button
              onClick={handleBackToDashboard} // ✅ ¡Aquí está la clave!
              className="p-2 rounded-full hover:bg-gray-700 text-white hover:text-blue-400 transition-all duration-200 transform hover:scale-105"
              aria-label={t("back_to_dashboard") || "Volver al dashboard"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg text-white">{currentUser}</span>
            <div className="w-5 h-5 text-blue-400">✓</div>
          </div>
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("search_contacts_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => onViewChange("video-call")}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            currentView === "video-call"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex flex-col items-center">
            <Video className="w-4 h-4 mb-1" />
            <span>{t("calls")}</span>
          </div>
        </button>
        <button
          onClick={() => onViewChange("chat")}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            currentView === "chat"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex flex-col items-center">
            <MessageCircle className="w-4 h-4 mb-1" />
            <span>{t("messages")}</span>
          </div>
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4">
            <div className="w-16 h-16 mb-4 text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <p className="text-center font-medium">{t("no_contacts")}</p>
            <p className="text-center text-gray-400 mt-1">{t("start_new_conversation")}</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactSelect(contact.name)}
                className={`p-3 rounded-xl mb-2 cursor-pointer transition-all duration-200 relative ${
                  currentContact === contact.name
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "hover:bg-gray-800/50"
                }`}
              >
                {/* Badge de nuevo mensaje */}
                {contact.hasNewMessage && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-medium text-white text-lg">
                      {contact.avatar || contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        contact.status
                      )} rounded-full border-2 border-[#0f0f0f]`}
                    ></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-white truncate">{contact.name}</span>
                      {contact.isVerified && (
                        <div className="w-4 h-4 text-blue-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.49 4.49 0 01-6.706 1.549A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-6.706-1.549A4.49 4.49 0 012.25 12a4.49 4.49 0 011.549-3.397A4.49 4.49 0 0112 2.25z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M12 6.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0112 6.75zm0 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{contact.lastMessage}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">13:20</span>
                    {contact.status === "online" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onViewChange("video-call")}
            className="bg-green-600 hover:bg-green-700 p-3 rounded-xl transition-colors group"
          >
            <div className="flex flex-col items-center">
              <Phone className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white mt-1">{t("call")}</span>
            </div>
          </button>
          <button
            onClick={() => onViewChange("video-call")}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl transition-colors group"
          >
            <div className="flex flex-col items-center">
              <Video className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white mt-1">{t("video")}</span>
            </div>
          </button>
          <button
            onClick={() => onViewChange("chat")}
            className="bg-gray-600 hover:bg-gray-700 p-3 rounded-xl transition-colors group"
          >
            <div className="flex flex-col items-center">
              <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white mt-1">{t("chat")}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}