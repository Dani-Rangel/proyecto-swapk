// new_message_modal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslations"; // ✅ Importa el hook de traducción

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSelect?: (contact: string) => void;
  suggestedUsers: User[];
}

export default function NewMessageModal({ isOpen, onClose, onContactSelect, suggestedUsers }: NewMessageModalProps) {
  const { t } = useTranslation(); // ✅ Hook de traducción
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredUsers = suggestedUsers.filter((user) => {
    // ✅ Validar que name y username existan
    if (!user.name || !user.username) return false;

    const nameMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const usernameMatch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || usernameMatch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-bold text-white">{t("new_message")}</h3> {/* ✅ Traducido */}
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <label htmlFor="to" className="block text-sm text-gray-400 mb-2">
            {t("to_label")} 
          </label>
          <div className="relative">
            <input
              type="text"
              id="to"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Suggested Users */}
        <div className="max-h-80 overflow-y-auto p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">{t("suggested")}</h4> 
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t("no_users_found")}</p> 
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => onContactSelect?.(user.name)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{user.name}</div>
                    <div className="text-xs text-gray-400 truncate">@{user.username}</div>
                  </div>
                  <div className="w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              if (filteredUsers.length > 0) {
                onContactSelect?.(filteredUsers[0].name);
              }
            }}
            disabled={filteredUsers.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {t("chat")}
          </button>
        </div>
      </div>
    </div>
  );
}