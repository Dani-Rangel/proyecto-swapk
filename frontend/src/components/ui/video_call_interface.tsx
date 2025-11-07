"use client"

import { useState, useEffect, useRef } from "react"
import { ContactsSidebar } from "./contacts_sidebar"
import { ChatArea } from "./chat_area"
import { NotificationToast } from "./notification_toast"
import { ErrorAlert } from "./error_alert"
import { CallAlert } from "./call_alert"
import {
  Phone,
  Video,
  VideoOff,
  MoreVertical,
  Mic,
  MicOff,
  Volume2,
  Monitor,
  MoreHorizontal,
  Clock,
} from "lucide-react"
import { useVideoCall } from "@/components/state/video_call_provider"

type ViewMode = "video-call" | "chat" | "screen-share" | "screen-select" | "calling"

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
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCalling, setIsCalling] = useState(false) // ✅ Estado local para "llamando"

  const { callState: webRtcCallState, startCall, handleAction } = useVideoCall()

  // Actualizar vista según estado de llamada
  useEffect(() => {
    if (webRtcCallState.isInCall) {
      setViewMode("video-call")
      setIsCalling(false)
    } else if (isCalling) {
      setViewMode("calling")
    } else {
      if (viewMode === "video-call" || viewMode === "calling") {
        setViewMode("chat")
      }
    }
  }, [webRtcCallState.isInCall, isCalling, viewMode])

  const getUserData = () => {
    if (typeof window === "undefined") return { token: null, userId: null, name: "Desconocido" }
    const userData = localStorage.getItem("user")
    if (!userData) return { token: null, userId: null, name: "Desconocido" }

    try {
      const parsed = JSON.parse(userData)
      return {
        token: parsed.token,
        userId: String(parsed.id),
        name: parsed.nombre || parsed.name || "Desconocido",
      }
    } catch (error) {
      console.error("Error al parsear datos de usuario:", error)
      return { token: null, userId: null, name: "Desconocido" }
    }
  }

  const { name: currentUser } = getUserData()

  useEffect(() => {
    if (webRtcCallState.isInCall) {
      const timer = setInterval(() => {
        setNotification(`En llamada con ${webRtcCallState.currentContact || "alguien"}`)
      }, 10000)
      return () => clearInterval(timer)
    }
  }, [webRtcCallState.isInCall, webRtcCallState.currentContact])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCallAction = (action: string) => {
    handleAction(action as any)

    const messages: Record<string, string> = {
      mute: webRtcCallState.isMuted ? "Micrófono activado" : "Micrófono silenciado",
      camera: webRtcCallState.isCameraOff ? "Cámara activada" : "Cámara desactivada",
      "hang-up": "Llamada finalizada",
      answer: "Llamada contestada",
      decline: "Llamada rechazada",
      "screen-share": webRtcCallState.isScreenSharing ? "Compartir pantalla detenido" : "Compartiendo pantalla",
    }

    const message = messages[action]
    if (message) {
      setNotification(message)
      setTimeout(() => setNotification(null), 3000)
    }

    if (action === "hang-up" || action === "decline" || action === "answer") {
      setIsCalling(false)
      setViewMode("chat")
    }
  }

  const handleContactSelect = (contactName: string) => {
    setSelectedContact(contactName)
    setViewMode("chat")
    setContacts((prev) => {
      const existingContact = prev.find((c) => c.name === contactName)
      if (existingContact) return prev

      const newContact: Contact = {
        id: Date.now().toString(),
        name: contactName,
        status: "online",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random&size=128`,
        isVerified: false,
      }
      return [...prev, newContact]
    })
  }

  // ✅ Nueva función para iniciar llamada
  const handleStartCall = (contactName: string, withVideo: boolean) => {
    const contact = contacts.find((c) => c.name === contactName)
    if (contact) {
      setIsCalling(true)
      startCall(contact.id, contact.name, withVideo)
    }
  }

  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (remoteVideoRef.current && webRtcCallState.remoteStream) {
      remoteVideoRef.current.srcObject = webRtcCallState.remoteStream
      remoteVideoRef.current.play().catch((e) => console.warn("Error al reproducir video remoto:", e))
    }

    if (localVideoRef.current && webRtcCallState.localStream) {
      localVideoRef.current.srcObject = webRtcCallState.localStream
      localVideoRef.current.play().catch((e) => console.warn("Error al reproducir video local:", e))
    }
  }, [webRtcCallState.remoteStream, webRtcCallState.localStream, webRtcCallState.isScreenSharing])

  const renderCallView = () => {
    if (!webRtcCallState.isInCall) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#141414] p-6">
          <div className="text-gray-500 text-lg">Llamada no activa</div>
        </div>
      )
    }

    const contactName = webRtcCallState.currentContact || "Desconocido"
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random&size=32`

    return (
      <div className="flex-1 flex items-center justify-center bg-[#141414] p-4">
        <div className="w-full max-w-5xl h-[calc(100vh-180px)] bg-[#141414] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gray-700/30">
          <div className="flex-1 relative group">
            {webRtcCallState.remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-blue-950/40 flex items-center justify-center border border-blue-400/20">
                    <Volume2 className="w-12 h-12 text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-gray-400 text-sm">Esperando video de {contactName}...</p>
                </div>
              </div>
            )}

            <div className="absolute top-6 left-6 bg-blue-500/70 backdrop-blur-md px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-3 border border-blue-400/40 shadow-lg">
              <img
                src={avatarUrl}
                alt={contactName}
                className="w-8 h-8 rounded-full border border-white/40"
              />
              <span className="text-white">{contactName}</span>
            </div>

            {webRtcCallState.isScreenSharing && (
              <div className="absolute top-6 right-6 bg-orange-600/70 backdrop-blur-md px-3 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 border border-orange-500/40 shadow-lg">
                <Monitor className="w-4 h-4" />
                Compartiendo
              </div>
            )}

            {webRtcCallState.localStream && (
              <div
                className={`absolute bottom-6 right-6 w-40 h-28 rounded-xl overflow-hidden shadow-2xl border-2 transition-all duration-300 ${
                  webRtcCallState.isCameraOff
                    ? "border-orange-600/50 bg-gray-900"
                    : "border-white/30 hover:border-white/50"
                }`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${webRtcCallState.isCameraOff ? "opacity-0" : "opacity-100"}`}
                />
                {webRtcCallState.isCameraOff && (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center border-t border-gray-800/50">
                    <div className="text-center">
                      <VideoOff className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                      <span className="text-white text-xs font-semibold">Cámara apagada</span>
                    </div>
                  </div>
                )}
                {webRtcCallState.isScreenSharing && (
                  <div className="absolute top-0 left-0 right-0 bg-orange-600/80 text-white text-[9px] text-center font-bold py-1 backdrop-blur-sm">
                    Pantalla
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border-t border-gray-700/50 px-6 py-3 text-center text-white flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">En directo</span>
            </div>
            <div className="w-px h-4 bg-gray-700"></div>
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatDuration(webRtcCallState.callDuration)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCallingView = () => {
    if (!isCalling) {
      return null
    }

    const contactName = selectedContact || "alguien"

    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] p-6">
        <div className="bg-gray-900 rounded-2xl p-12 text-center max-w-md w-full border border-gray-700/50 shadow-2xl">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl animate-pulse">
            <Phone className="w-16 h-16 text-white rotate-[135deg]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Llamando a {contactName}...</h2>
          <p className="text-gray-500 mb-8 text-sm">Esperando que conteste</p>
          <button
            onClick={() => handleCallAction("hang-up")}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Cancelar llamada
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#141414] text-white">
      <ContactsSidebar
        currentContact={selectedContact}
        onContactSelect={handleContactSelect}
        onViewChange={setViewMode}
        currentView={viewMode}
        onOpenNewChatModal={() => setIsModalOpen(true)}
      />

      <div className="flex-1 flex flex-col relative">
        {selectedContact && !webRtcCallState.isInCall && !isCalling && (
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-400/30">
                  <span className="font-medium text-white">{selectedContact.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedContact}</h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>En línea</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2.5 hover:bg-gray-800 rounded-lg transition-all duration-200 group border border-gray-600/50 hover:border-gray-500"
                  onClick={() => handleStartCall(selectedContact, false)}
                >
                  <Phone className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  className="p-2.5 hover:bg-gray-800 rounded-lg transition-all duration-200 group border border-gray-600/50 hover:border-gray-500"
                  onClick={() => handleStartCall(selectedContact, true)}
                >
                  <Video className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </button>

                <button className="p-2.5 hover:bg-gray-800 rounded-lg transition-all duration-200 group border border-gray-600/50 hover:border-gray-500">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          {webRtcCallState.isInCall && renderCallView()}
          {isCalling && renderCallingView()}
          {!webRtcCallState.isInCall && !isCalling && viewMode === "chat" && (
            <ChatArea
              currentContact={selectedContact}
              onContactSelect={handleContactSelect}
              onViewChange={setViewMode}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </div>

        {webRtcCallState.isInCall && (
          <div className="bg-gray-900 border-t border-gray-700/50 px-6 py-5 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleCallAction("mute")}
                className={`p-3.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center gap-2 border ${
                  webRtcCallState.isMuted
                    ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600/60"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700/50 hover:border-gray-600"
                }`}
                title={webRtcCallState.isMuted ? "Activar micrófono" : "Silenciar micrófono"}
              >
                {webRtcCallState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleCallAction("camera")}
                className={`p-3.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center gap-2 border ${
                  webRtcCallState.isCameraOff
                    ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600/60"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700/50 hover:border-gray-600"
                }`}
                title={webRtcCallState.isCameraOff ? "Activar cámara" : "Desactivar cámara"}
              >
                {webRtcCallState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleCallAction("screen-share")}
                className={`p-3.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center gap-2 border ${
                  webRtcCallState.isScreenSharing
                    ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600/60"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700/50 hover:border-gray-600"
                }`}
                title={webRtcCallState.isScreenSharing ? "Detener compartir pantalla" : "Compartir pantalla"}
              >
                <Monitor className="w-5 h-5" />
              </button>

              <div className="w-px h-8 bg-gray-800/50"></div>

              <button
                className="p-3.5 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 text-gray-300 border border-gray-700/50 hover:border-gray-600"
                title="Más opciones"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleCallAction("hang-up")}
                className="p-3.5 bg-orange-600 hover:bg-orange-700 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 text-white border border-orange-600/60 hover:border-orange-500 shadow-lg hover:shadow-orange-600/30"
                title="Colgar"
              >
                <Phone className="w-5 h-5 rotate-[135deg]" />
              </button>
            </div>
          </div>
        )}

        {/* ✅ Sin props: el componente ya maneja el estado global */}
        <CallAlert />

        {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  )
}