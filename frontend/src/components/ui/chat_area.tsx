"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NewMessageModal from "./new_message_modal";
import { Send, Paperclip, Smile, MessageSquare } from "lucide-react";
import { useTranslation } from "../../lib/useTranslations";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: "text" | "file";
  fileUrl?: string;
  fileName?: string;
}

// ✅ Nueva interfaz para el chat del backend
interface BackendChat {
  chat_id: number;
  tipo: string;
  usuarios: { id: string; nombre: string }[];
  ultimo_mensaje: string | null;
  fecha_ultimo_mensaje: string | null;
}

interface ChatAreaProps {
  currentContact: string | null;
  onContactSelect?: (contact: string) => void;
  onViewChange?: (view: "chat" | "video-call" | "screen-share") => void;
}

export function ChatArea({ currentContact, onContactSelect, onViewChange }: ChatAreaProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados para WebSocket y conexión ---
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- ✅ NUEVO: Estado para almacenar los chats del usuario ---
  const [userChats, setUserChats] = useState<BackendChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // --- Obtener token y user ID desde localStorage ---
  let token: string | null = null;
  let myUserId: string | null = null;

  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        token = parsed.token;
        myUserId = String(parsed.id);
      } catch (error) {
        console.error("Error parsing auth data from localStorage:", error);
      }
    }
  }

  // --- Cargar todos los usuarios ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users/all`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setAllUsers(
          data.map((user: any) => ({
            id: String(user.id),
            name: user.name,
            username: user.username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`,
          }))
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllUsers([
          {
            id: "1",
            name: "Usuario de prueba",
            username: "prueba",
            avatar: "https://ui-avatars.com/api/?name=Prueba&background=random&size=128",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // --- ✅ Cargar los chats del usuario al montar ---
  useEffect(() => {
    const fetchUserChats = async () => {
      if (!token || !myUserId) {
        setLoadingChats(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setUserChats(data.chats || []);
        console.log("✅ Chats del usuario cargados:", data.chats);

        // --- ✅ Opción: Seleccionar automáticamente el primer chat ---
        if (data.chats && data.chats.length > 0 && !currentContact && onContactSelect) {
          const firstChat = data.chats[0];
          const otherUser = firstChat.usuarios.find((u: any) => u.id !== myUserId);
          if (otherUser) {
            onContactSelect(otherUser.nombre);
          }
        }
      } catch (err) {
        console.error("❌ Error al cargar los chats del usuario:", err);
        setError("No se pudieron cargar tus chats");
      } finally {
        setLoadingChats(false);
      }
    };

    fetchUserChats();
  }, [token, myUserId, onContactSelect]);

  // --- Conectar WebSocket cuando cambia el contacto ---
  useEffect(() => {
    // Obtener token y user ID
    let token: string | null = null;
    let myUserId: string | null = null;

    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("user");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed.token;
          myUserId = String(parsed.id);
        } catch (error) {
          console.error("Error parsing auth data from localStorage:", error);
        }
      }
    }

    if (!currentContact || !token || !myUserId) {
      if (ws) {
        ws.close();
        setWs(null);
        setIsConnected(false);
        setCurrentChatId(null);
      }
      return;
    }

    const otherUser = allUsers.find((u) => u.name === currentContact);
    if (!otherUser) {
      setError("Usuario no encontrado");
      return;
    }

    const initializeChat = async () => {
      try {
        // 1. Crear o obtener el chat_id
        const res = await fetch(`${API_URL}/chats/start/${otherUser.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error al iniciar chat: ${res.status}`);
        }

        const data = await res.json();
        const chatId = data.chat_id;
        setCurrentChatId(chatId);

        // 2. Cargar mensajes previos desde el backend
        const messagesRes = await fetch(`${API_URL}/chats/${chatId}/messages`);
        if (!messagesRes.ok) {
          throw new Error(`Error al cargar mensajes: ${messagesRes.status}`);
        }
        const messagesData = await messagesRes.json();

        // Convertir mensajes del backend al formato del frontend
        const loadedMessages = messagesData.messages.map((msg: any) => ({
          id: msg.id.toString(),
          sender: msg.id_usuario.toString() === myUserId ? "Tú" : otherUser.name || "Otro Usuario",
          content: msg.contenido,
          timestamp: new Date(msg.fecha).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: msg.id_usuario.toString() === myUserId,
          type: msg.tipo === "imagen" || msg.tipo === "archivo" ? "file" : "text",
          fileUrl: msg.url_archivo || undefined,
          fileName: msg.url_archivo ? "Archivo" : undefined,
        }));

        setMessages(loadedMessages);

        // 3. Conectar al WebSocket
        const wsUrl = `ws://localhost:8000/chats/ws/${chatId}?token=${token}`;
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log("✅ WebSocket conectado al chat:", chatId);
          setIsConnected(true);
          setError(null);
        };

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "message") {
            const receivedMsg = data.message;
            const isOwnMessage = receivedMsg.id_usuario.toString() === myUserId;

            const newMessage: Message = {
              id: receivedMsg.id.toString(),
              sender: isOwnMessage ? "Tú" : otherUser.name || "Otro Usuario",
              content: receivedMsg.contenido,
              timestamp: new Date(receivedMsg.fecha).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isOwn: isOwnMessage,
              type: receivedMsg.tipo === "imagen" || receivedMsg.tipo === "archivo" ? "file" : "text",
              fileUrl: receivedMsg.url_archivo || undefined,
              fileName: receivedMsg.url_archivo ? "Archivo" : undefined,
            };

            setMessages((prev) => [...prev, newMessage]);
          }
        };

        websocket.onclose = () => {
          console.log("🔌 WebSocket desconectado");
          setIsConnected(false);
        };

        websocket.onerror = (err) => {
          console.error("❌ WebSocket Error:", err);
          setError("Error de conexión con el servidor");
          setIsConnected(false);
        };

        setWs(websocket);

        // Cleanup
        return () => {
          websocket.close();
        };
      } catch (err) {
        console.error("❌ Error al inicializar chat:", err);
        setError("No se pudo iniciar el chat");
      }
    };

    initializeChat();
  }, [currentContact, allUsers]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const currentUser = "Jefferson Correa";
  const chatHistory: User[] = messages.length > 0 ? allUsers.slice(0, 3) : [];

  // --- Enviar mensaje al backend ---
    const handleSendMessage = () => {
    if (!message.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket no está listo para enviar");
      return;
    }

    const payload = {
      type: "message",
      content: message,
      chat_id: currentChatId,
      user_id: myUserId,
      tipo: "texto",
    };

    try {
      ws.send(JSON.stringify(payload));
      console.log("✅ Mensaje enviado:", payload);

      // Limpiar mensaje local
      setMessage("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("❌ Error al enviar mensaje:", err);
      setError("Error al enviar mensaje. Intenta nuevamente.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Seleccionar emoji
  const handleEmojiSelect = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  // Subir archivo (simulado)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: t("default_user"),
      content: "",
      timestamp: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
      type: "file",
      fileUrl,
      fileName: file.name,
    };

    setMessages((prev) => [...prev, newMessage]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Mostrar loader mientras se cargan datos
  if (loading || loadingChats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="text-white">Cargando tus chats...</div>
      </div>
    );
  }

  // --- Pantalla de lista de chats (cuando no hay contacto seleccionado) ---
  if (!currentContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start bg-[#141414] p-6 sm:p-8 pt-16">
        {userChats.length > 0 ? (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Tus Chats Recientes
            </h2>
            <div className="space-y-3">
              {userChats.map((chat) => {
                const otherUser = chat.usuarios.find((u: any) => u.id !== myUserId);
                if (!otherUser) return null;
                return (
                  <div
                    key={chat.chat_id}
                    onClick={() => onContactSelect && onContactSelect(otherUser.nombre)}
                    className="p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#2a2a2a] cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{otherUser.nombre}</span>
                      <span className="text-xs text-gray-400">
                        {chat.fecha_ultimo_mensaje
                          ? new Date(chat.fecha_ultimo_mensaje).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mt-1">
                      {chat.ultimo_mensaje || "Sin mensajes"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // --- Pantalla de "empezar nuevo chat" ---
          <div className="flex flex-col items-center text-center max-w-md mx-auto animate-fadeIn">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg border border-gray-700">
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              {t("messages")}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8">
              {t("private_chat_description")}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300"
            >
              {t("send_message")}
            </button>

            {isModalOpen && (
              <NewMessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onContactSelect={(contactName) => {
                  onContactSelect?.(contactName);
                  onViewChange?.("chat");
                  setIsModalOpen(false);
                }}
                suggestedUsers={
                  chatHistory.length > 0
                    ? chatHistory
                    : allUsers.filter((u) => u.name !== currentUser)
                }
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Chat activo ---
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col bg-[#141414]">
        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-120px)]">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">
              {t("no_messages_yet")}
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? "order-2" : "order-1"}`}>
                  {!msg.isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-400">{msg.sender}</span>
                    </div>
                  )}

                  {/* Si es archivo */}
                  {msg.type === "file" ? (
                    <div className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white">
                      {msg.fileUrl && msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName}
                          className="rounded-lg max-w-full mb-2"
                        />
                      ) : null}
                      <p className="text-sm break-words">
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName}
                          className="text-blue-400 underline"
                        >
                          {msg.fileName}
                        </a>
                      </p>
                      <p className="text-xs mt-1 text-gray-400">{msg.timestamp}</p>
                    </div>
                  ) : (
                    // Si es texto
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.isOwn ? "bg-blue-600 text-white" : "bg-[#1a1a1a] text-white"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isOwn ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje */}
        <div className="p-4 border-t border-gray-700 bg-[#1a1a1a] relative">
          <div className="flex items-center gap-3">
            {/* Subir archivo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Input texto */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isConnected
                    ? t("write_message_placeholder")
                    : "Conectando..."
                }
                disabled={!isConnected}
                className="w-full bg-[#141414] border border-gray-600 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
              />
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-700 rounded p-1 transition-colors"
              >
                <Smile className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Botón enviar */}
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Picker de emojis */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 right-4 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                searchDisabled={true}
              />
            </div>
          )}

          {/* Mostrar error si existe */}
          {error && (
            <div className="mt-2 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}