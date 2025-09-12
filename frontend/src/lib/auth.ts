export interface UserData {
  id: number
  nombre: string
  correo: string
  perfil?: string
  token?: string
}

export const getCurrentUser = (): UserData | null => {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")

  if (!userStr) return null // Si no hay usuario en localStorage, retorna null

  try {
    const user = JSON.parse(userStr) // Parseamos el JSON guardado
    console.log("Usuario recuperado:", user) // Agrega esto para ver qué datos se recuperan
    return user
  } catch (error) {
    console.error("Error al analizar el usuario desde localStorage:", error)
    return null // Si hay un error en el parseo, retornamos null
  }
}