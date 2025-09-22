"use client"

import { useState, useEffect } from "react"
import { ContactsSidebar } from "./contacts_sidebar"
import { VideoCallArea } from "./video_call_area"
import { ChatArea } from "./chat_area"
import { ScreenShareArea } from "./screen_share_area"
import { CallControls } from "./call_controls"
import { NotificationToast } from "./notification_toast"
import { ErrorAlert } from "./error_alert"
import { Phone, Video, MoreVertical } from "lucide-react"

type ViewMode = "video-call" | "chat" | "screen-share" | "screen-select"

interface CallState {
  isInCall: boolean
  isMuted: boolean
  isCameraOff: boolean
  isRecording: boolean
  isScreenSharing: boolean
  callDuration: number
}

interface Contact {
  id: string
  name: string
  status: "online" | "away" | "offline"
  lastMessage?: string
  avatar: string
  isVerified?: boolean
}

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
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentUser = "Jefferson Correa"

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

  const handleContactSelect = (contactName: string) => {
    setSelectedContact(contactName)
    setViewMode("chat")
    setContacts(prev => {
      const existingContact = prev.find(c => c.name === contactName)
      if (existingContact) return prev
      const newContact: Contact = {
        id: Date.now().toString(),
        name: contactName,
        status: "online",
        avatar: contactName.charAt(0).toUpperCase(),
        isVerified: false,
      }
      return [...prev, newContact]
    })
  }

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
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col relative">
        {/* Barra superior */}
        {selectedContact && (
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
                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors group">
                  <Phone className="w-5 h-5 text-gray-300 group-hover:text-green-400" />
                </button>
                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors group">
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
          {viewMode === "video-call" && selectedContact && (
            <VideoCallArea
              isInCall={callState.isInCall}
              isCameraOff={callState.isCameraOff}
              currentContact={selectedContact}
            />
          )}
          {viewMode === "chat" && (
            <ChatArea
              currentContact={selectedContact}
              onContactSelect={handleContactSelect}
              onViewChange={setViewMode}
            />
          )}
          {viewMode === "screen-share" && <ScreenShareArea />}
          {viewMode === "screen-select" && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Seleccionar pantalla para compartir</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div
                  className="bg-[#1a1a1a] rounded-xl p-4 cursor-pointer hover:bg-[#2a2a2a] transition-all duration-200 transform hover:scale-105"
                  onClick={() => handleCallAction("start-screen-share")}
                >
                  <div className="aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-sm font-medium">Pantalla completa</span>
                  </div>
                  <p className="text-sm text-center font-medium">Pantalla completa</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controles de llamada */}
        {callState.isInCall && (
          <CallControls
            callState={{ ...callState, currentContact: selectedContact || "" }}
            onAction={handleCallAction}
          />
        )}
      </div>

      {/* Notificaciones y errores */}
      {notification && (
        <NotificationToast message={notification} onClose={() => setNotification(null)} />
      )}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  )
}