// components/ui/video_call_area.tsx
import { useState, useEffect, useRef } from "react";
import { Clock, Mic, MicOff, Video, VideoOff, Phone, Monitor, MoreHorizontal } from "lucide-react";
import { useVideoCall } from "@/components/state/video_call_provider";

interface VideoCallAreaProps {
  isInCall: boolean;
  isCameraOff: boolean;
  currentContact: string;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}

export function VideoCallArea({
  isInCall,
  isCameraOff,
  currentContact,
  remoteStream,
  localStream,
}: VideoCallAreaProps) {
  const [callTime, setCallTime] = useState(0);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Obtener handleAction desde el contexto
  const { handleAction } = useVideoCall();

  // Asignar streams a los elementos de video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("📦 Asignando remoteStream al video remoto");
      const videoTracks = remoteStream.getVideoTracks();
      const audioTracks = remoteStream.getAudioTracks();
      console.log("🎥 Video tracks en remoteStream:", videoTracks.length, videoTracks);
      console.log("🎙️ Audio tracks en remoteStream:", audioTracks.length, audioTracks);

      if (videoTracks.length === 0) {
        console.warn("⚠️ El stream no tiene video tracks. ¿Es una llamada de audio solo?");
      }

      remoteVideoRef.current.srcObject = remoteStream;

      // ✅ Forzar reproducción
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("⚠️ Error al reproducir video remoto:", e);
        });
      }
    }

    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;

      const playPromise = localVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("⚠️ Error al reproducir video local:", e);
        });
      }
    }
  }, [remoteStream, localStream]);

  // Contador de duración de llamada
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isInCall) {
      interval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 relative bg-black overflow-hidden">
      {/* Video remoto ocupando toda la pantalla */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ background: "black", display: "block" }}
          onCanPlay={() => console.log("🎬 Video remoto listo para reproducir")}
          onPlaying={() => console.log("▶️ Video remoto reproduciéndose")}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f1f]">
          <div className="text-gray-400 text-sm">Conectando...</div>
        </div>
      )}

      {/* Video local en esquina inferior izquierda */}
      {localStream && (
        <div className="absolute bottom-4 left-4 w-20 h-16 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              isCameraOff ? "hidden" : "block"
            }`}
            onCanPlay={() => console.log("🎬 Video local listo para reproducir")}
          />
          {isCameraOff && (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-white text-xs">Yo</span>
            </div>
          )}
        </div>
      )}

      {/* Overlay inferior con controles */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span className="font-medium">{currentContact}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(callTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded-md transition-all duration-200 ${
              isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleAction("mute")}
            title={isCameraOff ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {isCameraOff ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-300" />}
          </button>

          <button
            className={`p-2 rounded-md transition-all duration-200 ${
              isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleAction("camera")}
            title={isCameraOff ? "Activar cámara" : "Desactivar cámara"}
          >
            {isCameraOff ? <VideoOff className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-gray-300" />}
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
}