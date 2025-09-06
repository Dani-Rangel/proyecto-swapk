"use client"

import React, { createContext, useContext, useState } from "react"

// ✅ Exportamos la interfaz para poder usarla fuera si se necesita
export interface Notificacion {
  id: number
  contenido: string
  tipo: string
  leido: boolean
  fecha: string
}

// ✅ Tipo del contexto
interface NotificacionesContextType {
  notificaciones: Notificacion[]
  agregarNotificacion: (nueva: Omit<Notificacion, "id" | "fecha" | "leido">) => void
  marcarComoLeida: (id: number) => void
}

// ✅ Contexto con tipo seguro
const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined)

// ✅ Proveedor del contexto
export const NotificacionesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  // ✅ Tipado de 'nueva' para que no dé error
  const agregarNotificacion = (nueva: Omit<Notificacion, "id" | "fecha" | "leido">) => {
    setNotificaciones((prev) => [
      {
        id: Date.now(), // Puedes cambiar esto por un UUID si prefieres
        contenido: nueva.contenido,
        tipo: nueva.tipo,
        leido: false,
        fecha: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const marcarComoLeida = (id: number) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
    )
  }

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, agregarNotificacion, marcarComoLeida }}
    >
      {children}
    </NotificacionesContext.Provider>
  )
}

// ✅ Custom hook para usar el contexto
export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext)
  if (!context) {
    throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider")
  }
  return context
}
