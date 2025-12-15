// src/services/publicacionAdmin.ts

export type TipoPublicacion = "Intercambio" | "Curso" | "Pregunta" | "Logro";

// --- Interfaces ---
export interface UsuarioRelacionado {
  id: number;
  nombre: string;
  correo: string;
}

export interface PerfilRelacionado {
  id: number;
}

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  tipo: TipoPublicacion;
  imagen?: string | null;
  fecha_creacion: string; // ISO string
  id_usuario: number;
  id_perfil?: number | null;
  usuario?: UsuarioRelacionado;
  perfil?: PerfilRelacionado;
}

// --- Formularios ---
export interface CreatePublicacionData {
  titulo: string;
  contenido: string;
  tipo: TipoPublicacion;
  imagen?: string | null;
  id_usuario: number;
  id_perfil?: number | null;
}

export interface UpdatePublicacionData {
  titulo?: string;
  contenido?: string;
  tipo?: TipoPublicacion;
  imagen?: string | null;
  id_usuario?: number;
  id_perfil?: number | null;
}

// --- Servicio ---
class PublicacionService {
  private static BASE_URL = "https://backend-production-fc5e.up.railway.app/admin"; // ✅ Cambiado: ahora incluye /admin

  // LISTAR todas las publicaciones
  static async listar(): Promise<Publicacion[]> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/`); // ✅ Quitado /admin
    if (!res.ok) throw new Error("Error al listar publicaciones");
    return await res.json();
  }

  // OBTENER una publicación por ID
  static async obtener(id: number): Promise<Publicacion> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/${id}`); // ✅ Quitado /admin
    if (!res.ok) throw new Error("Publicación no encontrada");
    return await res.json();
  }

  // CREAR nueva publicación
  static async crear(data: CreatePublicacionData): Promise<Publicacion> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/`, { // ✅ Quitado /admin
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Error al crear publicación");
    }
    return await res.json();
  }

  // ACTUALIZAR publicación existente
  static async actualizar(id: number, data: UpdatePublicacionData): Promise<Publicacion> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/${id}`, { // ✅ Quitado /admin
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Error al actualizar publicación");
    }
    return await res.json();
  }

  // ELIMINAR publicación
  static async eliminar(id: number): Promise<{ ok: boolean; message: string }> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/${id}`, { // ✅ Quitado /admin
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar publicación");
    return await res.json();
  }

  // OBTENER todos los usuarios (para selects)
  static async listarUsuarios(): Promise<UsuarioRelacionado[]> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/usuarios`); // ✅ Quitado /admin
    if (!res.ok) throw new Error("Error al cargar usuarios");
    return await res.json();
  }

  // OBTENER todos los perfiles (para selects)
  static async listarPerfiles(): Promise<PerfilRelacionado[]> {
    const res = await fetch(`${this.BASE_URL}/publicaciones/perfiles`); // ✅ Quitado /admin
    if (!res.ok) throw new Error("Error al cargar perfiles");
    return await res.json();
  }
}

export { PublicacionService };
