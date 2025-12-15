// services/inscripcionCursoApi.ts
import axios from "axios"

const API_BASE_URL = "https://backend-production-fc5e.up.railway.app"

export interface UsuarioSimple {
  id: number
  nombre: string
}

export interface InscripcionCurso extends InscripcionCursoCreate {
  id: number
  fecha_inscripcion: string
  estado: "Pendiente" | "Confirmado" | "Finalizado"
  usuario?: UsuarioSimple // ← opcional, pero útil
}

export interface InscripcionCursoCreate {
  curso_id: number
  usuario_id: number
}

export interface InscripcionCurso extends InscripcionCursoCreate {
  id: number
  fecha_inscripcion: string
  estado: "Pendiente" | "Confirmado" | "Finalizado"
}

// Helper para obtener el token
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  return { Authorization: `Bearer ${user.token}` }
}

export const inscripcionCursoAPI = {
  // Crear inscripción
  create: async (data: InscripcionCursoCreate): Promise<InscripcionCurso> => {
    const response = await axios.post(`${API_BASE_URL}/inscripciones_cursos/`, data, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  // Obtener inscripciones de un usuario
  getByUser: async (userId: number): Promise<InscripcionCurso[]> => {
    const response = await axios.get(`${API_BASE_URL}/inscripciones_cursos/usuario/${userId}`, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  // Verificar si un usuario está inscrito en un curso
  checkInscripcion: async (cursoId: number, userId: number): Promise<boolean> => {
    const response = await axios.get(`${API_BASE_URL}/inscripciones_cursos/check/${cursoId}/${userId}`, {
      headers: getAuthHeader(),
    })
    return response.data.inscrito
  },

  // Eliminar inscripción
  eliminar: async (inscripcionId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/inscripciones_cursos/${inscripcionId}`, {
      headers: getAuthHeader(),
    })
  },

  // Aceptar inscripción (solo creador del curso)
  aceptarInscripcion: async (inscripcionId: number): Promise<void> => {
    await axios.put(`${API_BASE_URL}/inscripciones_cursos/${inscripcionId}/aceptar`, {}, {
      headers: getAuthHeader(),
    })
  },

  // Finalizar inscripción (solo creador del curso)
  finalizarInscripcion: async (inscripcionId: number): Promise<void> => {
    await axios.put(`${API_BASE_URL}/inscripciones_cursos/${inscripcionId}/finalizar`, {}, {
      headers: getAuthHeader(),
    })
  },

  getInscripcionesByCurso: async (cursoId: number): Promise<InscripcionCurso[]> => {
  const token = JSON.parse(localStorage.getItem("user") || "{}").token
  const response = await axios.get(`${API_BASE_URL}/inscripciones_cursos/curso/${cursoId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  return response.data
},
}
