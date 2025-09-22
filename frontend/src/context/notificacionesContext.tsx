"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import notificacionAPI, { Notificacion, NotificacionCreate } from "@/services/notificacion"
import { getCurrentUser } from "@/lib/auth"

interface NotificacionesContextType {
  notificaciones: Notificacion[]
  cargarNotificaciones: (userId: number) => void
  agregarNotificacion: (data: NotificacionCreate) => void
  marcarComoLeida: (id: number) => Promise<void>
  eliminarNotificacion: (id: number) => Promise<void>
  refrescarNotificaciones: () => void
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined)

export const NotificacionesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const usuario = getCurrentUser()
    if (usuario) {
      setUserId(usuario.id)
      cargarNotificaciones(usuario.id)
    }
  }, [])

  const cargarNotificaciones = async (userId: number) => {
    try {
      const data = await notificacionAPI.getByUser(userId)
      setNotificaciones(data)
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    }
  }

  const agregarNotificacion = async (nueva: NotificacionCreate) => {
    try {
      const response = await notificacionAPI.create(nueva)
      setNotificaciones((prev) => [response, ...prev])
    } catch (error) {
      console.error("Error al crear notificación:", error)
    }
  }

  const marcarComoLeida = async (id: number) => {
    try {
      const actualizada = await notificacionAPI.marcarLeida(id)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? actualizada : n))
      )
    } catch (error) {
      console.error("Error al marcar como leída:", error)
      throw error
    }
  }

  const eliminarNotificacion = async (id: number) => {
    try {
      await notificacionAPI.eliminar(id)
      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
      throw error
    }
  }

  const refrescarNotificaciones = () => {
    if (userId) {
      cargarNotificaciones(userId)
    }
  }

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        cargarNotificaciones,
        agregarNotificacion,
        marcarComoLeida,
        eliminarNotificacion,
        refrescarNotificaciones,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  )
}

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext)
  if (!context) {
    throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider")
  }
  return context
}
