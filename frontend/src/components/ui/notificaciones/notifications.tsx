"use client"

import React, { useState } from "react"
import { Bell, X } from "lucide-react"
import { useNotificaciones } from "@/context/notificacionesContext"
import { motion, AnimatePresence } from "framer-motion"

export function Notificaciones({ isDark }: { isDark: boolean }) {
  const {
    notificaciones,
    marcarComoLeida,
    eliminarNotificacion,
    notificacionesNoLeidas,
  } = useNotificaciones()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleMarcarComoLeida = async (id: number) => {
    setLoadingId(id)
    setError(null)
    try {
      await marcarComoLeida(id)
    } catch {
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
    } catch {
      setError("Error al eliminar la notificación")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        title="Notificaciones"
        aria-label="Mostrar notificaciones"
        onClick={() => setShowModal(true)}
        className="inline-flex cursor-pointer h-8 items-center justify-center text-gray-600 hover:text-gray-900 dark:text-[#A0A0A0] dark:hover:text-[#F5F5F5] transition-colors duration-300"
      >
        <Bell className="h-5 w-5" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[16px] h-4 flex items-center justify-center animate-pulse">
            {notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Contenedor del modal */}
            <motion.div
              className={`relative w-[90%] max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-colors duration-300 ${
                isDark
                  ? "bg-[#121212] text-white border-gray-800"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 200 }}
            >
              {/* Encabezado */}
              <div
                className={`flex justify-between items-center px-5 py-3 border-b ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Notificaciones
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Cerrar"
                  className={`transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo */}
              <div className="max-h-[400px] overflow-y-auto p-4">
                {error && (
                  <div
                    className={`p-3 text-sm border rounded-md mb-3 ${
                      isDark
                        ? "text-red-400 border-red-700"
                        : "text-red-600 border-red-300"
                    }`}
                  >
                    {error}
                  </div>
                )}

                {notificaciones.length === 0 ? (
                  <div
                    className={`text-center py-6 ${
                      isDark ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    No tienes notificaciones nuevas
                  </div>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 mb-2 rounded-lg border transition-all duration-200 flex justify-between items-start ${
                        isDark
                          ? n.leido
                            ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                            : "border-gray-600 bg-gray-900/40 text-white font-medium"
                          : n.leido
                            ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                            : "border-gray-300 bg-gray-100 text-gray-900 font-medium"
                      }`}
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleMarcarComoLeida(n.id)}
                      >
                        <div className="font-semibold">{n.contenido}</div>
                        <div
                          className={`text-xs mt-1 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {new Date(n.fecha).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleEliminar(n.id)}
                        disabled={loadingId === n.id}
                        className={`ml-2 transition-colors ${
                          isDark
                            ? "text-gray-500 hover:text-red-500"
                            : "text-gray-400 hover:text-red-600"
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Pie */}
              <div
                className={`px-5 py-3 border-t text-center text-sm transition-colors ${
                  isDark
                    ? "border-gray-700 text-gray-500"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {notificacionesNoLeidas > 0
                  ? `${notificacionesNoLeidas} sin leer`
                  : "Todas las notificaciones leídas"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
