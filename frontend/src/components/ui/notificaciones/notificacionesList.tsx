"use client"

import React, { useEffect, useState, useRef } from "react"
import { X } from "lucide-react"
import { useNotificaciones } from "@/context/notificacionesContext"

export const NotificacionesList: React.FC = () => {
  const { notificaciones, marcarComoLeida } = useNotificaciones()
  const [visibles, setVisibles] = useState<number[]>([])
  const timeouts = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    const nuevas = notificaciones.filter(
      (n) => !n.leido && !visibles.includes(n.id)
    )
    if (nuevas.length === 0) return

    setVisibles((prev) => [...prev, ...nuevas.map((n) => n.id)])

    nuevas.forEach((notif) => {
      const timeout = setTimeout(() => {
        marcarComoLeida(notif.id)
        setVisibles((prev) => prev.filter((id) => id !== notif.id))
      }, 5000) // 5 segundos
      timeouts.current.push(timeout)
    })

    return () => {
      timeouts.current.forEach(clearTimeout)
      timeouts.current = []
    }
  }, [notificaciones])

  const notificacionesVisibles = notificaciones.filter((n) =>
    visibles.includes(n.id)
  )

  if (notificacionesVisibles.length === 0) return null

  const getBgColor = (tipo: string) => {
    switch (tipo) {
      case "Curso":
        return "from-blue-500 to-blue-600 border-blue-700"
      case "Mensaje":
        return "from-green-500 to-green-600 border-green-700"
      default:
        return "from-purple-500 to-purple-600 border-purple-700"
    }
  }

  return (
    <div
      className="fixed top-4 right-4 z-[9999] space-y-3 max-h-[80vh] overflow-y-auto p-1"
      aria-live="polite"
      role="status"
    >
      {notificacionesVisibles.map((notif) => (
        <div
          key={notif.id}
          className={`relative bg-gradient-to-r ${getBgColor(notif.tipo)} text-white p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-500 ease-out animate-fade-in-up`}
          style={{
            animation: "fade-in-up 0.3s ease-out",
            animationFillMode: "forwards",
          }}
        >
          <button
            onClick={() => {
              marcarComoLeida(notif.id)
              setVisibles((prev) => prev.filter((id) => id !== notif.id))
            }}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-sm font-semibold">{notif.tipo}</strong>
                <span className="text-xs opacity-90">
                  {new Date(notif.fecha).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed break-words">{notif.contenido}</p>
            </div>
          </div>

          {/* Barra de progreso de tiempo */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/60 animate-progress"
              style={{
                animation: "progress 5s linear forwards",
                animationFillMode: "forwards",
              }}
            ></div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  )
}