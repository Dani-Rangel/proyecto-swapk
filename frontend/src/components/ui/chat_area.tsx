"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NewMessageModal from "./new_message_modal";
import { Send, Paperclip, Smile, MessageSquare, Edit2, Trash2, Plus } from "lucide-react";
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
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

export function ChatArea({
  currentContact,
  onContactSelect,
  onViewChange,
  isModalOpen,
  setIsModalOpen,
}: ChatAreaProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [allUsers, setAllUsers] = useState<Map<string, User>>(new Map()); // ✅ Usar Map
  const [loading, setLoading] = useState(true);

  // --- Estados para el modal ---
  const modalOpen = isModalOpen || false;
  const setModalOpen = setIsModalOpen || (() => {});

  // --- WebSocket ---
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Chats del usuario ---
  const [userChats, setUserChats] = useState<BackendChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // --- Edición/eliminación ---
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // --- Obtener token y user ID ---
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
        console.error("Error parsing auth data:", error);
      }
    }
  }

  // --- Cargar usuarios de /users/all + chats ---
  useEffect(() => {
    const fetchUsers = async () => {
      if (!myUserId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/all`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();

        const usersFromApi = data
          .filter((user: any) => String(user.id) !== myUserId)
          .map((user: any) => ({
            id: String(user.id),
            name: user.name,
            username: user.username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`,
          }));

        // ✅ Combinar con usuarios de chats
        const combinedUsers = new Map<string, User>();

        // Agregar usuarios de chats
        userChats.forEach(chat => {
          chat.usuarios.forEach(u => {
            if (String(u.id) !== String(myUserId)) {
              combinedUsers.set(u.id, {
                id: u.id,
                name: u.nombre,
                username: u.nombre,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre)}&background=random&size=128`,
              });
            }
          });
        });

        // Agregar usuarios de API (sobrescriben si ya existen)
        usersFromApi.forEach(user => {
          combinedUsers.set(user.id, user);
        });

        setAllUsers(combinedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllUsers(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [myUserId, userChats]); // ✅ Dependencia crítica

  // --- Cargar chats del usuario ---
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

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();

        setUserChats(data.chats || []);

        if (data.chats && data.chats.length > 0 && !currentContact && onContactSelect) {
          const firstChat = data.chats[0];
          const otherUser = firstChat.usuarios.find((u: any) => String(u.id) !== String(myUserId));
          if (otherUser) {
            onContactSelect(otherUser.nombre);
          }
        }
      } catch (err) {
        console.error("❌ Error al cargar chats:", err);
        setError("No se pudieron cargar tus chats");
      } finally {
        setLoadingChats(false);
      }
    };

    fetchUserChats();
  }, [token, myUserId, onContactSelect]);

  // --- Conectar WebSocket cuando cambia el contacto ---
  useEffect(() => {
    if (!currentContact || !token || !myUserId) {
      if (ws) {
        ws.close();
        setWs(null);
        setIsConnected(false);
        setCurrentChatId(null);
      }
      return;
    }

    // ✅ Buscar contacto en `allUsers` o en `userChats`
    const findUserInChats = (): User | null => {
      for (const chat of userChats) {
        const otherUser = chat.usuarios.find(
          (u: any) => 
            String(u.id) !== String(myUserId) && 
            u.nombre === currentContact &&
            u.id !== undefined
        );
        if (otherUser) {
          return {
            id: otherUser.id,
            name: otherUser.nombre,
            username: otherUser.nombre,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.nombre)}&background=random&size=128`,
          };
        }
      }
      return null;
    };

    const otherUser = Array.from(allUsers.values()).find(
      (u) => u.name === currentContact
    ) || findUserInChats();

    if (!otherUser) {
      setError("Usuario no encontrado");
      return;
    }

    // ✅ Validación explícita antes de iniciar el chat
    if (String(otherUser.id) === String(myUserId)) {
      setError("No puedes chatear contigo mismo");
      console.warn("⚠️ Bloqueado intento de chat consigo mismo:", { otherUser, myUserId });
      return;
    }

    setMessages([]);
    
    const initializeChat = async () => {
      try {
        const res = await fetch(`${API_URL}/chats/start/${otherUser.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          let errorMessage = `Error ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }

        const data = await res.json();
        const chatId = data.chat_id;
        setCurrentChatId(chatId);

        const messagesRes = await fetch(`${API_URL}/chats/${chatId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!messagesRes.ok) {
          let msgError = `Error ${messagesRes.status}`;
          try {
            const errorData = await messagesRes.json();
            msgError = errorData.detail || msgError;
          } catch (e) {}
          throw new Error(msgError);
        }

        const messagesData = await messagesRes.json();

        const validMessages = messagesData.messages.filter(
          (msg: any) => msg.contenido !== null && msg.contenido !== ""
        );

        // ✅ CORREGIDO: Usar `allUsers` para encontrar el nombre real
        const loadedMessages = validMessages.map((msg: any) => {
          const isOwn = msg.id_usuario.toString() === myUserId;
          const senderUser = allUsers.get(String(msg.id_usuario)); // ✅ Usar Map
          return {
            id: msg.id.toString(),
            sender: isOwn ? "Tú" : (senderUser?.name || "Usuario desconocido"), // ✅ .name, no .nombre
            content: msg.contenido,
            timestamp: new Date(msg.fecha).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isOwn,
            type: msg.tipo === "imagen" || msg.tipo === "archivo" ? "file" : "text",
            fileUrl: msg.url_archivo || undefined,
            fileName: msg.url_archivo ? "Archivo" : undefined,
          };
        });

        setMessages(loadedMessages);

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

            if (!receivedMsg.contenido) {
              console.warn("⚠️ Mensaje recibido con contenido null, ignorado");
              return;
            }

            const senderUser = allUsers.get(String(receivedMsg.id_usuario)); // ✅ Usar Map
            const newMessage: Message = {
              id: receivedMsg.id.toString(),
              sender: isOwnMessage ? "Tú" : (senderUser?.name || "Usuario desconocido"), // ✅ .name
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

            setMessages((prev) => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
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
      } catch (err) {
        console.error("❌ Error al inicializar chat:", err);
        setError(err instanceof Error ? err.message : "No se pudo iniciar el chat");
      }
    };

    initializeChat();
  }, [currentContact, allUsers, userChats, myUserId, token]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const currentUser = "Jefferson Correa";

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!message.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket no listo");
      return;
    }

    const payload = {
      type: "message",
      content: message.trim(),
      chat_id: currentChatId,
      user_id: myUserId,
      tipo: "texto",
    };

    try {
      ws.send(JSON.stringify(payload));
      setMessage("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("❌ Error al enviar mensaje:", err);
      setError("Error al enviar mensaje");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "Tú",
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

  // Editar mensaje
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!token || !currentChatId) return;

    try {
      const res = await fetch(`${API_URL}/chats/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_content: newContent }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const updatedMsg = await res.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: updatedMsg.contenido,
                timestamp: new Date(updatedMsg.fecha).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : msg
        )
      );

      setEditingMessageId(null);
      setEditContent("");

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "edit_message",
            message_id: messageId,
            new_content: updatedMsg.contenido,
            fecha: updatedMsg.fecha,
          })
        );
      }
    } catch (err) {
      console.error("❌ Error al editar mensaje:", err);
      setError("No se pudo editar el mensaje");
    }
  };

  // Eliminar mensaje
  const handleDeleteMessage = async (messageId: string) => {
    if (!token || !currentChatId) return;

    try {
      const res = await fetch(`${API_URL}/chats/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setShowDeleteConfirm(null);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "delete_message",
            message_id: messageId,
          })
        );
      }
    } catch (err) {
      console.error("❌ Error al eliminar mensaje:", err);
      setError("No se pudo eliminar el mensaje");
    }
  };

  // Renderizado condicional
  if (loading || loadingChats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

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
                const otherUser = chat.usuarios.find((u: any) => String(u.id) !== String(myUserId));
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
              onClick={() => setModalOpen(true)}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300"
            >
              {t("send_message")}
            </button>

            {modalOpen && (
              <NewMessageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onContactSelect={(contactName) => {
                  onContactSelect?.(contactName);
                  onViewChange?.("chat");
                  setModalOpen(false);
                }}
                suggestedUsers={Array.from(allUsers.values()).filter((u) => u.name !== currentUser)}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Chat activo
  return (
    <div className="flex h-full relative">
      <div className="flex-1 flex flex-col bg-[#141414] h-full">
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-160px)]">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">
              {t("no_messages_yet")}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} group relative`}
              >
                <div
                  className={`max-w-xs lg:max-w-md ${msg.isOwn ? "order-2" : "order-1"} ${
                    msg.isOwn ? "mr-12" : "ml-12"
                  }`}
                >
                  {!msg.isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-400">{msg.sender}</span>
                    </div>
                  )}

                  {msg.type === "file" ? (
                    <div className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white relative">
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
                      <div
                        className={`px-4 py-2 rounded-lg relative ${
                          msg.isOwn 
                            ? "bg-blue-800 text-white shadow-sm" 
                            : "bg-[#1a1a1a] text-white"
                        }`}
                      >
                      {msg.isOwn && (
                        <div className="absolute -top-2 -right-9 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContextMenuOpen(msg.id);
                            }}
                            className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-all duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>

                          {contextMenuOpen === msg.id && (
                            <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-48 message-options-menu overflow-hidden">
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditContent(msg.content);
                                  setContextMenuOpen(null);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">Editar</span>
                              </button>
                              <div className="border-t border-gray-100"></div>
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(msg.id);
                                  setContextMenuOpen(null);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="font-medium">Eliminar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditMessage(msg.id, editContent)}
                              className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditContent("");
                              }}
                              className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-white transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.isOwn ? "text-blue-200" : "text-gray-400"
                            }`}
                          >
                            {msg.timestamp}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {showDeleteConfirm === msg.id && (
                  <div className="absolute top-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-4 min-w-64">
                    <p className="text-gray-800 text-sm font-medium mb-3">¿Quieres eliminar este mensaje?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-[#1a1a1a] relative h-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Paperclip className="cursor-pointer w-5 h-5 text-gray-400" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isConnected ? t("write_message_placeholder") : "Conectando..."
                }
                disabled={!isConnected}
                className="w-full bg-[#141414] border border-gray-600 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
              />
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-700 rounded p-1 transition-colors"
              >
                <Smile className="cursor-pointer w-4 h-4 text-gray-400" />
              </button>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected}
              className="cursor-pointer p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-16 right-4 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg z-50">
              <EmojiPicker onEmojiClick={handleEmojiSelect} searchDisabled={true} />
            </div>
          )}

          {error && (
            <div className="mt-2 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <NewMessageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onContactSelect={(contactName) => {
            onContactSelect?.(contactName);
            onViewChange?.("chat");
            setModalOpen(false);
          }}
          suggestedUsers={Array.from(allUsers.values()).filter((u) => u.name !== currentUser)}
        />
      )}
    </div>
  );
}