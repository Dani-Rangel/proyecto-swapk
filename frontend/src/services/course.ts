// src/services/course.ts
export interface Curso {
  id: number
  titulo: string
  descripcion: string
  objetivo: string
  user_id: number   // 👈 igual que tu modelo
  img_Cursos?: string
  fecha_creacion: string
  usuario?: {
    nombre: string
  }
}

export interface CreateCursoData {
  titulo: string
  descripcion: string
  objetivo: string
  user_id: number
  img_Cursos?: string
}

export interface UpdateCursoData {
  titulo?: string
  descripcion?: string
  objetivo?: string
  user_id?: number
  img_Cursos?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// === Obtener todos los cursos ===
export const getCursos = async (): Promise<Curso[]> => {
  const res = await fetch(`${API_URL}/admin/cursos/`)
  if (!res.ok) throw new Error("Error al obtener cursos")
  return res.json() as Promise<Curso[]>
}

// === Obtener un curso por ID ===
export const getCursoById = async (id: number): Promise<Curso> => {
  const res = await fetch(`${API_URL}/admin/cursos/${id}`)
  if (!res.ok) throw new Error("Error al obtener el curso")
  return res.json() as Promise<Curso>
}

// === Crear un curso ===
export async function createCurso(data: CreateCursoData): Promise<Curso> {
  const res = await fetch(`${API_URL}/admin/cursos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Error al crear el curso")
  }

  return res.json() as Promise<Curso>
}

// === Actualizar un curso ===
export const updateCurso = async (id: number, data: UpdateCursoData): Promise<Curso> => {
  const res = await fetch(`${API_URL}/admin/cursos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    const message =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail, null, 2)
    throw new Error(message || "Error al actualizar el curso")
  }

  return res.json() as Promise<Curso>
}

// === Eliminar un curso ===
export const deleteCurso = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/admin/cursos/${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const error = await res.json()
    const message =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail, null, 2)
    throw new Error(message || "Error al eliminar el curso")
  }
}
