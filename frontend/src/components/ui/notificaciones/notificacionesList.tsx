"use client"

import React, { useEffect, useState } from "react"
import { useNotificaciones } from "../../context/notificaciones_context"

export const NotificacionesList: React.FC = () => {
  const { notificaciones, marcarComoLeida } = useNotificaciones()
  const [visibles, setVisibles] = useState<number[]>([])

  useEffect(() => {
    const nuevas = notificaciones.filter(
      (n) => !n.leido && !visibles.includes(n.id)
    )

    nuevas.forEach((notif) => {
      setVisibles((prev) => [...prev, notif.id])

      setTimeout(() => {
        marcarComoLeida(notif.id) // Marcar como leída en el contexto
        setVisibles((prev) => prev.filter((id) => id !== notif.id)) // Quitar de la lista visible
      }, 3000)
    })
  }, [notificaciones])

  const notificacionesVisibles = notificaciones.filter(
    (n) => visibles.includes(n.id)
  )

  // Si no hay nada visible, no renderices nada
  if (notificacionesVisibles.length === 0) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        width: 320,
        maxHeight: "80vh",
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      {notificacionesVisibles.map((notif) => (
        <div
          key={notif.id}
          style={{
            marginBottom: 10,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#3b82f6",
            color: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <strong>{notif.tipo.replace("_", " ").toUpperCase()}</strong>
          <p style={{ margin: "6px 0 0" }}>{notif.contenido}</p>
          <small>{new Date(notif.fecha).toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  )
}