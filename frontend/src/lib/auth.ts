// lib/auth.ts

export interface UserData {
  id: number
  nombre: string
  correo: string
  rol: string
  perfilId?: number   // 👈 ID del perfil
  token?: string
}

// ✅ Obtener token desde cookies
const getTokenFromCookies = (): string | null => {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(^| )token=([^;]+)/)
  return match ? match[2] : null
}

// ✅ Obtener usuario desde localStorage
export const getCurrentUser = (): UserData | null => {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    const user: UserData = JSON.parse(userStr)

    // 👇 Si no tiene token en localStorage, intenta leer de cookies
    if (!user.token) {
      const token = getTokenFromCookies()
      if (token) {
        user.token = token
        localStorage.setItem("user", JSON.stringify(user)) // sincroniza
      }
    }

    console.log("✅ Usuario recuperado:", user)
    return user
  } catch (error) {
    console.error("❌ Error al analizar el usuario:", error)
    return null
  }
}

// ✅ Guardar usuario en localStorage + cookies
export const setCurrentUser = (user: UserData) => {
  if (typeof window === "undefined") return

  localStorage.setItem("user", JSON.stringify(user))
  if (user.token) {
    document.cookie = `token=${user.token}; path=/; max-age=3600; secure; samesite=strict`
  }

  console.log("✅ Usuario guardado:", user)
}

// ✅ Eliminar usuario de localStorage + cookies (logout)
export const clearCurrentUser = () => {
  if (typeof window === "undefined") return

  localStorage.removeItem("user")

  // 👇 Borrar cookie del token
  document.cookie = "token=; path=/; max-age=0"

  console.log("✅ Usuario eliminado de la sesión")
}

