"use client"
import React, { useState } from "react"
import { Bell } from "lucide-react"
import { useNotificaciones } from "@/context/notificacionesContext"

export function Notificaciones() {
  const { notificaciones, marcarComoLeida } = useNotificaciones()
  const [showNotifications, setShowNotifications] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(false)

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido).length

const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <div className="relative">
      <Bell
        className={`cursor-pointer flex-1 h-8 transition-colors duration-300  ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E] hover:text-[#F5F5F5] " : "text-gray-600 hover:text-gray-900"}`}
        onClick={() => setShowNotifications(!showNotifications)}
      />
      {notificacionesNoLeidas > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
          {notificacionesNoLeidas}
        </span>
      )}

      {showNotifications && (
        <div className="absolute left-8 top-0 w-80 bg-gray-800 text-white border border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 font-bold border-b border-gray-600">Notificaciones</div>
          {notificaciones.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">No tienes notificaciones</div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-3 text-sm border-b border-gray-700 ${
                  n.leido ? "text-gray-400" : "text-white font-semibold"
                }`}
                onClick={() => marcarComoLeida(n.id)}
              >
                {n.contenido}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(n.fecha).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
