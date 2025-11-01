// src/services/contenidoCursoApi.ts
import { getCurrentUser } from "@/lib/auth"

const API_BASE = "http://localhost:8000"

const getAuthToken = () => {
  const user = getCurrentUser()
  return user?.token || null
}

export interface BloqueContenido {
  id: number
  tipo: "texto" | "video" | "imagen" | "archivo"
  contenido: string
  orden: number
}

export interface ContenidoItem {
  id?: number
  titulo: string
  tipo: "texto" | "video" | "archivo" | "imagen" 
  contenido: string // ya no se usa en lecciones
  orden: number
  nivel: number
  parent_id: number | null
  children?: ContenidoItem[]
  bloques?: BloqueContenido[] 
}

export interface CursoContenidoResponse {
  curso_user_id: number
  contenido: ContenidoItem[]
}

export interface BloqueContenidoCreate {
  tipo: "texto" | "video" | "imagen" | "archivo"
  contenido: string
  orden?: number
}

export const contenidoCursoAPI = {
  async crear(cursoId: number, data: ContenidoItem) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/contenido/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, curso_id: cursoId }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || "Error al crear contenido")
    }
    return res.json()
  },

  async obtenerPorCurso(cursoId: number): Promise<CursoContenidoResponse> {
    const res = await fetch(`${API_BASE}/contenido/curso/${cursoId}`)
    if (!res.ok) throw new Error("Error al obtener contenido")
    return res.json()
  },

  async actualizar(id: number, data: ContenidoItem) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/contenido/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || "Error al actualizar contenido")
    }
    return res.json()
  },

  async eliminar(id: number) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/contenido/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || "Error al eliminar contenido")
    }
    return res.json()
  },
}

export const bloqueContenidoAPI = {
  async crear(leccionId: number, data: BloqueContenidoCreate) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/bloques/leccion/${leccionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    console.error("Error al crear bloque:", error)
    throw new Error(JSON.stringify(error))
    }
    return res.json()
  },

  async obtenerPorLeccion(leccionId: number): Promise<BloqueContenido[]> {
    const res = await fetch(`${API_BASE}/bloques/leccion/${leccionId}`)
    if (!res.ok) throw new Error("Error al obtener bloques")
    return res.json()
  },

  async actualizar(id: number, data: BloqueContenidoCreate) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/bloques/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || "Error al actualizar bloque")
    }
    return res.json()
  },

  async eliminar(id: number) {
    const token = getAuthToken()
    if (!token) throw new Error("No autorizado")
    const res = await fetch(`${API_BASE}/bloques/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || "Error al eliminar bloque")
    }
  },
}