"use client"

import { Mic, MicOff, Video, VideoOff, Phone, Monitor, MonitorOff, MoreHorizontal } from "lucide-react"
import { useState } from "react"

interface CallState {
  isInCall: boolean
  isMuted: boolean
  isCameraOff: boolean
  isRecording: boolean
  isScreenSharing: boolean
  currentContact: string
}

interface CallControlsProps {
  callState: CallState
  onAction: (action: string) => void
}

export function CallControls({ callState, onAction }: CallControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const ControlButton = ({
    id,
    icon: Icon,
    label,
    onClick,
    isActive,
    variant = "default",
  }: {
    id: string
    icon: any
    label: string
    onClick: () => void
    isActive?: boolean
    variant?: "default" | "danger" | "success"
  }) => {
    const baseClasses =
      "p-3.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center gap-2 relative group border"

    let colorClasses = "bg-slate-700/60 hover:bg-slate-600 text-gray-300 border-slate-600/50 hover:border-slate-500"
    if (isActive && variant === "danger")
      colorClasses =
        "bg-orange-600/80 hover:bg-orange-600 text-white border-orange-500/50 hover:border-orange-400 shadow-lg shadow-orange-500/20"
    if (isActive && variant === "default")
      colorClasses = "bg-orange-600/80 hover:bg-orange-600 text-white border-orange-500/50 hover:border-orange-400"
    if (variant === "danger")
      colorClasses =
        "bg-orange-600/80 hover:bg-orange-600 text-white border-orange-500/50 hover:border-orange-400 shadow-lg shadow-orange-500/20"
    if (variant === "success")
      colorClasses = "bg-amber-500/80 hover:bg-amber-500 text-white border-amber-400/50 hover:border-amber-300"

    return (
      <div className="relative">
        <button
          onMouseEnter={() => setHoveredButton(id)}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={onClick}
          title={label}
          className={`${baseClasses} ${colorClasses}`}
        >
          <Icon className="w-5 h-5" />

          {hoveredButton === id && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none border border-gray-700 shadow-lg">
              {label}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
            </div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border-t border-gray-700/50 px-6 py-5 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <ControlButton
          id="mute"
          icon={callState.isMuted ? MicOff : Mic}
          label={callState.isMuted ? "Activar micrófono" : "Silenciar micrófono"}
          onClick={() => onAction("mute")}
          isActive={callState.isMuted}
        />

        <ControlButton
          id="camera"
          icon={callState.isCameraOff ? VideoOff : Video}
          label={callState.isCameraOff ? "Activar cámara" : "Desactivar cámara"}
          onClick={() => onAction("camera")}
          isActive={callState.isCameraOff}
        />

        <ControlButton
          id="screen"
          icon={callState.isScreenSharing ? MonitorOff : Monitor}
          label={callState.isScreenSharing ? "Detener compartir pantalla" : "Compartir pantalla"}
          onClick={() => onAction("screen-share")}
          variant={callState.isScreenSharing ? "success" : "default"}
        />

        <div className="w-px h-8 bg-gray-800/50"></div>

        <button
          className="p-3.5 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 text-gray-300 border border-gray-700/50 hover:border-gray-600"
          title="Más opciones"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        <button
          onClick={() => onAction("hang-up")}
          className="p-3.5 bg-orange-600 hover:bg-orange-700 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 text-white border border-orange-600/60 hover:border-orange-500 shadow-lg hover:shadow-orange-600/30"
          title="Colgar"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </button>
      </div>
    </div>
  )
}
