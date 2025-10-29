// components/ui/video_call_interface.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ContactsSidebar } from "./contacts_sidebar";
import { ChatArea } from "./chat_area";
import { NotificationToast } from "./notification_toast";
import { ErrorAlert } from "./error_alert";
import { CallAlert } from "./call_alert";
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Mic, 
  MicOff, 
  Monitor, 
  MoreHorizontal,
  VideoOff
 } from "lucide-react"; 
import { useVideoCall } from "@/components/state/video_call_provider";

type ViewMode = "video-call" | "chat" | "screen-share" | "screen-select";

interface Contact {
  id: string;
  name: string;
  status: "online" | "away" | "offline";
  lastMessage?: string;
  avatar: string;
  isVerified?: boolean;
}

export default function VideoCallInterface() {
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { callState: webRtcCallState, startCall, handleAction } = useVideoCall();

  // Sincronizar estado local con WebRTC
  useEffect(() => {
    if (webRtcCallState.isInCall) {
      setViewMode("video-call"); // 👈 Cambiar a video-call al entrar en llamada
    }
  }, [webRtcCallState.isInCall]);

  // --- Obtener datos del usuario actual ---
  const getUserData = () => {
    if (typeof window === "undefined") return { token: null, userId: null, name: "Desconocido" };
    const userData = localStorage.getItem("user");
    if (!userData) return { token: null, userId: null, name: "Desconocido" };

    try {
      const parsed = JSON.parse(userData);
      return {
        token: parsed.token,
        userId: String(parsed.id),
        name: parsed.nombre || parsed.name || "Desconocido",
      };
    } catch (error) {
      console.error("Error al parsear datos de usuario:", error);
      return { token: null, userId: null, name: "Desconocido" };
    }
  };

  const { name: currentUser } = getUserData();

  // --- Estado para llamada entrante ---
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
  } | null>(null);

  // Temporizador para la duración de la llamada
  useEffect(() => {
    if (webRtcCallState.isInCall) {
      const timer = setInterval(() => {
        setNotification(`Duración: ${webRtcCallState.callDuration}s`);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [webRtcCallState.isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /** 🔹 Manejo centralizado de acciones */
  const handleCallAction = (action: string) => {
    handleAction(action as any);

    switch (action) {
      case "mute":
        setNotification(webRtcCallState.isMuted ? "Micrófono activado" : "Micrófono silenciado");
        break;

      case "camera":
        setNotification(webRtcCallState.isCameraOff ? "Cámara activada" : "Cámara desactivada");
        break;

      case "hang-up":
        setNotification("Llamada finalizada");
        setIncomingCall(null);
        break;

      case "answer":
        setNotification("Llamada contestada");
        break;

      case "decline":
        setNotification("Llamada rechazada");
        setIncomingCall(null);
        break;
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleContactSelect = (contactName: string) => {
    setSelectedContact(contactName);
    setViewMode("chat");
    setContacts((prev) => {
      const existingContact = prev.find((c) => c.name === contactName);
      if (existingContact) return prev;

      const newContact: Contact = {
        id: Date.now().toString(),
        name: contactName,
        status: "online",
        avatar: contactName.charAt(0).toUpperCase(),
        isVerified: false,
      };
      return [...prev, newContact];
    });
  };

  // Vista de llamada integrada directamente
  const renderCallView = () => {
    if (!webRtcCallState.remoteStream && !webRtcCallState.localStream) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-black">
          <div className="text-gray-300 text-lg">Conectando...</div>
          <div className="mt-4 text-gray-400 text-sm">Esperando video...</div>
        </div>
      );
    }

    return (
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Video remoto ocupando toda la pantalla */}
        {webRtcCallState.remoteStream ? (
          <video
            autoPlay
            playsInline
            muted={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ background: "black", display: "block" }}
            onCanPlay={() => console.log("🎬 Video remoto listo para reproducir")}
            onPlaying={() => console.log("▶️ Video remoto reproduciéndose")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f1f]">
            <div className="text-gray-400 text-sm">Esperando video...</div>
          </div>
        )}

        {/* Video local en esquina inferior izquierda */}
        {webRtcCallState.localStream && (
          <div className="absolute bottom-4 left-4 w-20 h-16 rounded-lg overflow-hidden shadow-lg border border-gray-700">
            <video
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                webRtcCallState.isCameraOff ? "hidden" : "block"
              }`}
              onCanPlay={() => console.log("🎬 Video local listo para reproducir")}
            />
            {webRtcCallState.isCameraOff && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-white text-xs">Yo</span>
              </div>
            )}
          </div>
        )}

        {/* Overlay inferior con controles */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="font-medium">{webRtcCallState.currentContact}</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {formatDuration(webRtcCallState.callDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-md transition-all duration-200 ${
                webRtcCallState.isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleAction("mute")}
              title={webRtcCallState.isCameraOff ? "Activar micrófono" : "Silenciar micrófono"}
            >
              {webRtcCallState.isCameraOff ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-300" />}
            </button>

            <button
              className={`p-2 rounded-md transition-all duration-200 ${
                webRtcCallState.isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleAction("camera")}
              title={webRtcCallState.isCameraOff ? "Activar cámara" : "Desactivar cámara"}
            >
              {webRtcCallState.isCameraOff ? <VideoOff className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-gray-300" />}
            </button>

            <button
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-all duration-200"
              title="Compartir pantalla"
            >
              <Monitor className="w-4 h-4 text-gray-300" />
            </button>

            <button
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-all duration-200"
              title="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-300" />
            </button>

            <button
              className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-all duration-200"
              onClick={() => handleAction("hang-up")}
              title="Colgar"
            >
              <Phone className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#141414] text-white">
      {/* Sidebar de contactos */}
      <ContactsSidebar
        currentContact={selectedContact}
        onContactSelect={handleContactSelect}
        onViewChange={setViewMode}
        currentView={viewMode}
        contacts={contacts}
        currentUser={currentUser}
        onOpenNewChatModal={() => setIsModalOpen(true)}
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col relative">
        {/* Barra superior */}
        {selectedContact && !webRtcCallState.isInCall && (
          <div className="px-6 py-4 bg-[#1a1a1a] border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="font-medium text-white">
                    {selectedContact.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedContact}</h3>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>En línea</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                  onClick={() => {
                    const contact = contacts.find((c) => c.name === selectedContact);
                    if (contact) startCall(contact.id, contact.name, false);
                  }}
                >
                  <Phone className="w-5 h-5 text-gray-300 group-hover:text-green-400" />
                </button>

                <button
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                  onClick={() => {
                    const contact = contacts.find((c) => c.name === selectedContact);
                    if (contact) startCall(contact.id, contact.name, true);
                  }}
                >
                  <Video className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                </button>

                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors group">
                  <MoreVertical className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido dinámico */}
        <div className="flex-1 relative">
          {webRtcCallState.isInCall && renderCallView()}

          {!webRtcCallState.isInCall && (
            <>
              {viewMode === "chat" && (
                <ChatArea
                  currentContact={selectedContact}
                  onContactSelect={handleContactSelect}
                  onViewChange={setViewMode}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {viewMode === "screen-share" && <ScreenShareArea />}
            </>
          )}
        </div>

        {/* Alerta de llamada entrante */}
        <CallAlert
          incomingCall={webRtcCallState.incomingCall}
          onAnswer={() => handleCallAction("answer")}
          onDecline={() => handleCallAction("decline")}
        />
      </div>

      {notification && (
        <NotificationToast message={notification} onClose={() => setNotification(null)} />
      )}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  );
}
