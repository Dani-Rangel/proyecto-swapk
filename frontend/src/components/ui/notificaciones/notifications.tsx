"use client"

import React, { useState } from "react"
import { Bell, X } from "lucide-react"
import { useNotificaciones } from "@/context/notificacionesContext"

export function Notificaciones() {
  const { notificaciones, marcarComoLeida, eliminarNotificacion } = useNotificaciones()
  const [showNotifications, setShowNotifications] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido).length

  const handleMarcarComoLeida = async (id: number) => {
    setLoadingId(id)
    setError(null)
    try {
      await marcarComoLeida(id)
    } catch (err) {
      setError("Error al marcar como leída")
    } finally {
      setLoadingId(null)
    }
  }

  const handleEliminar = async (id: number) => {
    setLoadingId(id)
    setError(null)
    try {
      await eliminarNotificacion(id)
    } catch (err) {
      setError("Error al eliminar la notificación")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="relative">
      <button
        title="Notificaciones"
        aria-label="Mostrar notificaciones"
        onClick={() => setShowNotifications(!showNotifications)}
        className="inline-flex cursor-pointer h-8 items-center justify-center text-gray-600 hover:text-gray-900 dark:text-[#A0A0A0] dark:hover:text-[#F5F5F5] transition-colors duration-300"
      >
        <Bell className="h-4 w-4" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[16px] h-4 flex items-center justify-center animate-pulse">
            {notificacionesNoLeidas}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          className="absolute left-8 top-0 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="p-3 font-bold border-b border-gray-600 flex justify-between items-center text-gray-400">
            Notificaciones
            <button
              aria-label="Cerrar notificaciones"
              onClick={() => setShowNotifications(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="p-3 text-red-500 text-sm border-b border-gray-700">{error}</div>
          )}

          {notificaciones.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">No tienes notificaciones</div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-3 text-sm border-b border-gray-700 flex justify-between items-start ${
                  n.leido ? "text-gray-400" : "text-white font-semibold"
                }`}
              >
                <div
                  className="cursor-pointer flex-1 break-words line-clamp-2"
                  onClick={() => handleMarcarComoLeida(n.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleMarcarComoLeida(n.id)
                    }
                  }}
                >
                  <div className="font-medium">{n.contenido}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.fecha).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleEliminar(n.id)}
                  aria-label="Eliminar notificación"
                  disabled={loadingId === n.id}
                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}