"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Marcar que estamos en el cliente
    setIsClient(true)

    // Verificar autenticación
    const checkAuth = () => {
      const user = localStorage.getItem("user")
      if (!user) {
        // Guardar la URL actual para redirigir después del login
        localStorage.setItem("redirectUrl", window.location.pathname + window.location.search)
        router.push("/auth/login")
      } else {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Mientras se carga o si no es cliente, mostrar loader
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Cargando sesión...</div>
      </div>
    )
  }

  return <>{children}</>
}