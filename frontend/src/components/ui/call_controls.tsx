// components/ui/call_controls.tsx
"use client";

import { Mic, MicOff, Video, VideoOff, Phone, Monitor, MoreHorizontal, Square } from "lucide-react";
import { useVideoCall } from "@/components/state/video_call_provider";

interface CallState {
  isInCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  currentContact: string;
}

interface CallControlsProps {
  callState: CallState;
  onAction: (action: string) => void;
}

export function CallControls({ callState, onAction }: CallControlsProps) {
  return (
    <div className="bg-[#1a1a1a] border-t border-gray-700 p-4">
      <div className="flex items-center justify-center gap-3">
        {/* Record Button */}
        <button
          onClick={() => onAction("record")}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
            callState.isRecording 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-gray-600 hover:bg-gray-700 text-gray-300"
          }`}
          title={callState.isRecording ? "Detener grabación" : "Grabar"}
        >
          <Square className="w-6 h-6" />
        </button>

        {/* Camera Button */}
        <button
          onClick={() => onAction("camera")}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
            callState.isCameraOff 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-gray-600 hover:bg-gray-700 text-gray-300"
          }`}
          title={callState.isCameraOff ? "Activar cámara" : "Desactivar cámara"}
        >
          {callState.isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        {/* Microphone Button */}
        <button
          onClick={() => onAction("mute")}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
            callState.isMuted 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-gray-600 hover:bg-gray-700 text-gray-300"
          }`}
          title={callState.isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={() => onAction("screen-share")}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
            callState.isScreenSharing 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-gray-600 hover:bg-gray-700 text-gray-300"
          }`}
          title={callState.isScreenSharing ? "Detener compartir pantalla" : "Compartir pantalla"}
        >
          <Monitor className="w-6 h-6" />
        </button>

        {/* More Options */}
        <button 
          className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full transition-all duration-200 transform hover:scale-110 text-gray-300"
          title="Más opciones"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>

        {/* Hang Up Button */}
        <button
          onClick={() => onAction("hang-up")}
          className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 transform hover:scale-110 text-white"
          title="Colgar"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
