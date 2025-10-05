import axios from "axios"

// Base URL de tu API FastAPI
const API_BASE_URL = "http://localhost:8000/cursos"

// =============================
// Tipos de datos (match con schemas de FastAPI)
// =============================

export interface Curso {
  id: number
  titulo: string
  descripcion?: string
  objetivo?: string
  img_Cursos?: string
  user_id: number // cambio aquí a user_id
  usuario?: { nombre: string }
  habilidades?: { id: number; habilidad_nombre: string; tipo?: string }[]
  attachments?: { id: number; url: string; file_name: string; file_size: number; fecha_subida: string }[]
}

export interface CursoCreate {
  titulo: string
  descripcion?: string
  objetivo?: string
  img_Cursos?: string
  user_id: number // cambio aquí también para crear cursos
}

export interface CursoUpdate {
  titulo?: string
  descripcion?: string
  objetivo?: string
  img_Cursos?: string
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentado a 30 segundos
})

// Interceptor para requests
api.interceptors.request.use((config) => {
  console.log(`Enviando request a: ${config.url}`)
  return config
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    console.log(`Respuesta recibida de: ${response.config.url}`, response.status)
    return response
  },
  (error) => {
    if (error.code === "ECONNREFUSED") {
      console.error("No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.")
    } else if (error.code === "NETWORK_ERROR") {
      console.error("Error de red. Verifica tu conexión a internet.")
    } else if (error.response) {
      console.error("Error del servidor:", error.response.status, error.response.data)
    } else if (error.request) {
      console.error("No se recibió respuesta del servidor. Verifica que el backend esté ejecutándose.")
    } else if (error.code === "ECONNABORTED") {
      console.error("Timeout: La solicitud tardó demasiado tiempo. Verifica que el backend esté respondiendo.")
    } else {
      console.error("Error:", error.message)
    }
    return Promise.reject(error)
  },
)

// =============================
// Métodos API
// =============================

// ✅ Crear curso
export const createCurso = async (curso: CursoCreate): Promise<Curso> => {
  try {
    const response = await api.post("/", curso)
    console.log("Curso creado:", response.data) // <-- Aquí
    return response.data
  } catch (error) {
    console.error("Error al crear curso:", error)
    throw error
  }
}

// ✅ Obtener todos los cursos
export const getCursos = async (): Promise<Curso[]> => {
  try {
    const response = await api.get("/")
    console.log("[v0] API Response - Full data:", response.data)
    if (response.data && response.data.length > 0) {
      console.log("[v0] First curso from API:", response.data[0])
      console.log("[v0] user_id in first curso:", response.data[0].user_id) // cambio aquí
      console.log(
        "[v0] All user_ids:",
        response.data.map((c: any) => ({ id: c.id, user_id: c.user_id })), // y aquí
      )
    }
    return response.data
  } catch (error) {
    console.error("Error al obtener cursos:", error)
    return []
  }
}

// ✅ Obtener un curso por ID
export const getCursoById = async (cursoId: number): Promise<Curso> => {
  try {
    const response = await api.get(`/${cursoId}`)
    console.log("Curso obtenido por ID:", response.data) // <-- Aquí
    return response.data
  } catch (error) {
    console.error(`Error al obtener curso ${cursoId}:`, error)
    throw error
  }
}

// ✅ Actualizar un curso
export const updateCurso = async (cursoId: number, cursoData: CursoUpdate): Promise<Curso> => {
  try {
    const response = await api.put(`/${cursoId}`, cursoData)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar curso ${cursoId}:`, error)
    throw error
  }
}

// ✅ Eliminar un curso
export const deleteCurso = async (cursoId: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/${cursoId}`)
    return response.data
  } catch (error) {
    console.error(`Error al eliminar curso ${cursoId}:`, error)
    throw error
  }
}

// Obtener el número de inscritos confirmados en un curso
export const getInscritosCount = async (cursoId: number): Promise<number> => {
  try {
    const response = await api.get(`/inscritos-count/${cursoId}`)
    return response.data.count || 0
  } catch (error) {
    console.error("Error al obtener contador de inscritos:", error)
    return 0
  }
}
