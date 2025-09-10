"use client";

import type React from "react";
import { useState } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  MessageSquare,
} from "lucide-react";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface ChatAreaProps {
  currentContact: string | null; // Puede ser null si no hay chat seleccionado
}

export function ChatArea({ currentContact }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  /**
   * Maneja el envío de un mensaje
   */
  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "Tú",
        content: message,
        timestamp: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };

  /**
   * Enviar mensaje al presionar Enter
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ Solo mostramos el mensaje inicial si NO hay contacto seleccionado
  if (!currentContact) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#141414] p-6 sm:p-8">
      {/* Contenedor principal con animación sutil */}
      <div className="flex flex-col items-center text-center max-w-md mx-auto animate-fadeIn">

        {/* Icono animado */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg border border-gray-700">
          <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 transition-transform duration-300 hover:scale-110" />
        </div>

        {/* Título principal */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
          Tus mensajes
        </h2>

        {/* Subtítulo descriptivo */}
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm mb-8 px-2">
          Comunícate en privado con tus amigos. Todo lo que compartas aquí es solo entre ustedes.
        </p>

        {/* Botón principal con estilo premium */}
        <button className="group relative px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#141414]">
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            Enviar mensaje
          </span>

          {/* Efecto de brillo sutil al hacer hover */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </button>

        {/* Decoración sutil en el fondo */}
        <div className="absolute -z-10 top-1/4 left-1/4 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -z-10 bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

  // ✅ Si hay contacto, mostramos el chat normal
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Encabezado del chat */}
        <div className="p-4 border-b border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="font-medium">
                  {currentContact.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-white">{currentContact}</h3>
                <p className="text-sm text-green-400">En línea</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-gray-300" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Video className="w-5 h-5 text-gray-300" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">
              No hay mensajes en esta conversación todavía.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md ${
                    msg.isOwn ? "order-2" : "order-1"
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
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.isOwn ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input de mensaje */}
        <div className="p-4 border-t border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="w-full bg-[#141414] border border-gray-600 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:border-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-700 rounded p-1 transition-colors">
                <Smile className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}