// video_call_interface.tsx
"use client"

import { useState, useEffect } from "react"
import { ContactsSidebar } from "./contacts_sidebar"
import { VideoCallArea } from "./video_call_area"
import { ChatArea } from "./chat_area"
import { ScreenShareArea } from "./screen_share_area"
import { CallControls } from "./call_controls"
import { NotificationToast } from "./notification_toast"
import { ErrorAlert } from "./error_alert"

type ViewMode = "video-call" | "chat" | "screen-share" | "screen-select"

interface CallState {
  isInCall: boolean
  isMuted: boolean
  isCameraOff: boolean
  isRecording: boolean
  isScreenSharing: boolean
  // ❌ REMOVIDO: currentContact ya no pertenece aquí
  callDuration: number
}

// ✅ Agregamos un estado separado para el contacto seleccionado
export default function VideoCallInterface() {
  const [viewMode, setViewMode] = useState<ViewMode>("chat")
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isMuted: false,
    isCameraOff: true,
    isRecording: false,
    isScreenSharing: false,
    callDuration: 0,
  })
  const [selectedContact, setSelectedContact] = useState<string | null>(null) // ✅ ¡ESTO ES CLAVE!
  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (callState.isInCall) {
      const timer = setInterval(() => {
        setCallState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [callState.isInCall])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCallAction = (action: string) => {
    switch (action) {
      case "mute":
        setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }))
        setNotification(callState.isMuted ? "Micrófono activado" : "Micrófono silenciado")
        break
      case "camera":
        setCallState((prev) => ({ ...prev, isCameraOff: !prev.isCameraOff }))
        setNotification(callState.isCameraOff ? "Cámara activada" : "Cámara desactivada")
        break
      case "record":
        setCallState((prev) => ({ ...prev, isRecording: !prev.isRecording }))
        setNotification(callState.isRecording ? "Grabación detenida" : "Grabación iniciada")
        break
      case "screen-share":
        if (callState.isScreenSharing) {
          setCallState((prev) => ({ ...prev, isScreenSharing: false }))
          setViewMode("video-call")
          setNotification("Compartir pantalla detenido")
        } else {
          setViewMode("screen-select")
        }
        break
      case "hang-up":
        setCallState((prev) => ({ ...prev, isInCall: false }))
        setNotification("Llamada finalizada")
        break
      case "start-screen-share":
        setCallState((prev) => ({ ...prev, isScreenSharing: true }))
        setViewMode("screen-share")
        setNotification("Compartiendo pantalla")
        break
    }

    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="flex h-screen bg-[#141414] text-white">
      {/* Sidebar de contactos */}
      <ContactsSidebar
        currentContact={selectedContact || ""} // ✅ Pasamos selectedContact (puede ser null)
        onContactSelect={setSelectedContact} // ✅ Cuando se selecciona, actualizamos selectedContact
        onViewChange={setViewMode}
        currentView={viewMode}
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col relative">
        {/* Barra superior — solo si hay contacto seleccionado */}
        {selectedContact && (
          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {selectedContact
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <span className="font-medium">{selectedContact}</span>
                {callState.isInCall && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>En llamada - {formatDuration(callState.callDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenido dinámico */}
        <div className="flex-1 relative">
          {viewMode === "video-call" && selectedContact && (
            <VideoCallArea
              isInCall={callState.isInCall}
              isCameraOff={callState.isCameraOff}
              currentContact={selectedContact}
            />
          )}

          {viewMode === "chat" && (
            <ChatArea currentContact={selectedContact} /> // ✅ Aquí lo pasamos como null o string
          )}

          {viewMode === "screen-share" && <ScreenShareArea />}

          {viewMode === "screen-select" && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Seleccionar pantalla para compartir</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div
                  className="bg-[#1a1a1a] rounded-lg p-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => handleCallAction("start-screen-share")}
                >
                  <div className="aspect-video bg-gray-700 rounded mb-2 flex items-center justify-center">
                    <span className="text-sm">Pantalla completa</span>
                  </div>
                  <p className="text-sm">Pantalla completa</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controles de llamada — solo si hay llamada activa */}
        {callState.isInCall && <CallControls callState={{ ...callState, currentContact: selectedContact || "" }} onAction={handleCallAction} />}
      </div>

      {/* Notificaciones */}
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  )
}