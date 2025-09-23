"use client";

import { useState, useEffect } from "react";
import { Phone, MessageCircle, Video, MoreVertical, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/useTranslations";
import { useRouter } from "next/navigation";
import { useVideoCall } from "@/components/state/video_call_provider";

// ✅ Interfaz para los chats que vienen del backend
interface BackendChat {
  chat_id: number;
  tipo: string;
  usuarios: { id: string; nombre: string }[];
  ultimo_mensaje: string | null;
  fecha_ultimo_mensaje: string | null;
}

// ✅ Interfaz de Contacto para mostrar en el UI
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
  currentUser?: string;
  onOpenNewChatModal: () => void;
}

export function ContactsSidebar({
  currentContact,
  onContactSelect,
  onViewChange,
  currentView,
  currentUser = "Tú",
  onOpenNewChatModal,
}: ContactsSidebarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [enhancedContacts, setEnhancedContacts] = useState<Contact[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startCall } = useVideoCall();

  // Función interna — no depende de props
  const handleBackToDashboard = () => {
    if (typeof window !== "undefined") {
      router.push("/dashboard/index_dashboard");
    }
  };

  // Cargar chats reales del backend al montar
  const fetchUserChats = async () => {
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
          console.error("Error al parsear datos de usuario:", error);
          setLoadingChats(false);
          return;
        }
      }
    }

    if (!token || !myUserId) {
      setLoadingChats(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.chats)) {
        setEnhancedContacts([]);
        setLoadingChats(false);
        return;
      }

      // ✅ Convertir chats en contactos únicos — USAR ID COMO CLAVE (¡CORREGIDO!)
      const contactMap = new Map<string, Contact>();

      data.chats.forEach((chat: BackendChat) => {
        // ✅ Buscar al otro usuario (que no soy yo)
        const otherUser = chat.usuarios.find((u: any) => String(u.id) !== String(myUserId));
        if (!otherUser) return;

        const key = otherUser.id; // ✅ ¡USAR ID, NO NOMBRE!

        if (!contactMap.has(key)) {
          contactMap.set(key, {
            id: otherUser.id,
            name: otherUser.nombre,
            status: "online",
            lastMessage: chat.ultimo_mensaje || undefined,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              otherUser.nombre
            )}&background=random&size=128`,
            isVerified: false,
            hasNewMessage: !!chat.ultimo_mensaje,
          });
        } else {
          // ✅ Actualizar si ya existe (por ejemplo, nuevo mensaje)
          const existing = contactMap.get(key)!;
          existing.lastMessage = chat.ultimo_mensaje || existing.lastMessage;
          existing.hasNewMessage = !!chat.ultimo_mensaje;
        }
      });

      const contactsFromChats = Array.from(contactMap.values());
      setEnhancedContacts(contactsFromChats);
    } catch (err) {
      console.error("Error al cargar chats:", err);
      setError("No se pudieron cargar tus contactos. Verifica tu conexión.");
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchUserChats();
  }, []);

  // --- Escuchar actualizaciones de chats en tiempo real ---
  useEffect(() => {
    let websocket: WebSocket | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
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
            console.error("Error al parsear datos de usuario:", error);
          }
        }
      }

      if (!token || !myUserId) {
        console.log("⏳ Token no disponible, reintentando en 2s...");
        retryTimeout = setTimeout(connectWebSocket, 2000);
        return;
      }

      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/chats/ws/0?token=${encodeURIComponent(token)}`;
      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log("✅ WebSocket GLOBAL conectado para actualizaciones de chats");
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "chat_update" || data.type === "new_message") {
            console.log("🌍 Recibida actualización global, recargando chats...");
            fetchUserChats(); // ✅ Refresca contactos completos
          }
        } catch (err) {
          console.error("❌ Error al parsear mensaje del WebSocket global:", err);
        }
      };

      websocket.onclose = () => {
        console.log("🔌 WebSocket GLOBAL desconectado. Reintentando...");
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (err) => {
        console.error("❌ Error en WebSocket GLOBAL:", err);
      };
    };

    connectWebSocket();

    return () => {
      if (websocket) websocket.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

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

  // ✅ Función segura para seleccionar contacto
  const handleContactClick = (name: string) => {
    const contact = enhancedContacts.find(c => c.name === name);
    if (!contact) {
      console.warn(`❌ Intento de abrir chat con contacto no existente: ${name}`);
      return;
    }
    onContactSelect(name);
  };

  return (
    <div className="w-80 bg-[#0f0f0f] border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
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
            placeholder={t("search_contacts_placeholder") || "Buscar contactos..."}
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
            <span>{t("calls") || "Llamadas"}</span>
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
            <span>{t("messages") || "Mensajes"}</span>
          </div>
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>{t("loading_contacts") || "Cargando contactos..."}</p>
            <p className="text-xs mt-2">Verifica tu conexión y token</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 text-sm p-4">
            <p>⚠️ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
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
            <p className="text-center font-medium">{t("no_contacts") || "Sin contactos"}</p>
            <p className="text-center text-gray-400 mt-1">
              {t("start_new_conversation") || "Empieza una nueva conversación"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id} // ✅ Usar ID como key
                onClick={() => handleContactClick(contact.name)}
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
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        contact.name.charAt(0).toUpperCase()
                      )}
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
                    <span className="text-xs text-gray-500">—</span>
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

      {/* ✅ NUEVO FOOTER CON 3 BOTONES */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2 justify-center">
          {/* Botón Llamada */}
          <button
            onClick={() => {
              if (currentContact) {
                const otherUser = enhancedContacts.find(c => c.name === currentContact);
                if (otherUser) {
                  onViewChange("video-call");
                  startCall(otherUser.id, otherUser.name, false);
                } else {
                  alert("Usuario no encontrado. Por favor, selecciona un contacto válido.");
                }
              } else {
                alert("Selecciona un contacto primero.");
              }
            }}
            className="cursor-pointer flex-1 bg-green-600 hover:bg-green-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-white" />
            <span className="text-xs font-medium text-white">Call</span>
          </button>

          {/* Botón Nuevo Chat */}
          <button
            onClick={onOpenNewChatModal}
            className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <div className="relative">
              <MessageCircle className="w-4 h-4 text-white" />
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                N
              </div>
            </div>
            <span className="cursor-pointer text-xs font-medium text-white">New Chat</span>
          </button>

          {/* Botón Video */}
          <button
            onClick={() => {
              if (currentContact) {
                const otherUser = enhancedContacts.find(c => c.name === currentContact);
                if (otherUser) {
                  onViewChange("video-call");
                  startCall(otherUser.id, otherUser.name, true);
                } else {
                  alert("Usuario no encontrado. Por favor, selecciona un contacto válido.");
                }
              } else {
                alert("Selecciona un contacto primero.");
              }
            }}
            className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4 text-white" />
            <span className="text-xs font-medium text-white">Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}