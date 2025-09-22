// src/services/user.ts

// Tipos de usuario
export enum RolUsuario {
  Administrador = "Administrador",
  Moderador = "Moderador",
  Usuario = "Usuario",
}

export interface Usuario {
  id: number
  nombre: string
  correo: string
  rol: RolUsuario
  fecha_creacion: string
}

export interface CreateUsuarioData {
  nombre: string
  correo: string
  contrasena: string
  rol: RolUsuario
}

export interface UpdateUsuarioData {
  nombre?: string
  correo?: string
  rol?: RolUsuario
}

// URL base
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// === Obtener todos los usuarios ===
export const getUsers = async (): Promise<Usuario[]> => {
  const res = await fetch(`${API_URL}/api/users`) // ⬅️ Ajusta si el endpoint es diferente
  if (!res.ok) throw new Error("Error al obtener usuarios")
  return res.json() as Promise<Usuario[]>
}

// === Crear usuario ===
export const createUser = async (data: CreateUsuarioData): Promise<Usuario> => {
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Error al crear usuario")
  }

  return res.json() as Promise<Usuario>
}

// === Actualizar usuario ===
export const updateUser = async (id: number, data: UpdateUsuarioData): Promise<Usuario> => {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Error al actualizar usuario")
  }

  return res.json() as Promise<Usuario>
}

// === Eliminar usuario ===
export const deleteUser = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Error al eliminar usuario")
  }
}
