// services/inscripcionCursoApi.ts
import axios from "axios"

const API_BASE_URL = "http://localhost:8000"

export interface InscripcionCursoCreate {
  curso_id: number
  usuario_id: number
}

export interface InscripcionCurso extends InscripcionCursoCreate {
  id: number
  fecha_inscripcion: string
  estado: "Pendiente" | "Confirmado" | "Finalizado"
}

export const inscripcionCursoAPI = {
  // Crear inscripción
  create: async (data: InscripcionCursoCreate): Promise<InscripcionCurso> => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    const response = await axios.post(`${API_BASE_URL}/inscripciones_cursos/`, data, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    return response.data
  },

  // Obtener inscripciones de un usuario
  getByUser: async (userId: number): Promise<InscripcionCurso[]> => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    const response = await axios.get(`${API_BASE_URL}/inscripciones_cursos/usuario/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    return response.data
  },

  // Verificar si un usuario está inscrito en un curso
  checkInscripcion: async (cursoId: number, userId: number): Promise<boolean> => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    const response = await axios.get(`${API_BASE_URL}/inscripciones_cursos/check/${cursoId}/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    return response.data.inscrito
  },

  // Eliminar inscripción
  eliminar: async (inscripcionId: number): Promise<void> => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    await axios.delete(`${API_BASE_URL}/inscripciones_cursos/${inscripcionId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
  }
}