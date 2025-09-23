// components/ui/call_alert.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { PhoneIncoming, PhoneOff, User } from "lucide-react";
import { useVideoCall } from "../state/video_call_provider";

export const CallAlert = () => {
  const { callState, handleAction } = useVideoCall();

  if (!callState.incomingCall) return null;

  const callerName = callState.currentContact || "Usuario desconocido";
  const callerInitial = callerName.charAt(0).toUpperCase();

  return (
    <motion.div
      className="fixed bottom-6 right-6 bg-neutral-900 shadow-xl rounded-xl p-4 w-96 flex items-center gap-4 z-50 border border-gray-700"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      {/* Avatar con efecto pulse */}
      <motion.div
        className="relative w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center shadow-inner"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <User className="text-gray-300" size={30} />
      </motion.div>

      {/* Información de la llamada */}
      <div className="flex-1">
        <h3 className="text-white text-lg font-semibold">{callerName}</h3>
        <p className="text-gray-400 text-sm">te está llamando...</p>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={() => handleAction("answer")}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-md transition transform hover:scale-110"
          title="Contestar"
        >
          <PhoneIncoming size={22} />
        </button>

        <button
          onClick={() => handleAction("decline")}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-md transition transform hover:scale-110"
          title="Rechazar"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </motion.div>
  );
};
