export type TipoPublicacion = "Intercambio" | "Curso" | "Pregunta" | "Logro";

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  tipo: TipoPublicacion;
  imagen?: string | null;
  fecha_creacion: string; // ISO string
  id_usuario: number;
  nombre_usuario?: string;
}

export interface CreatePublicacionData {
  titulo: string;
  contenido: string;
  tipo: TipoPublicacion;
  imagen?: string | null;
  id_usuario: number;
}

export interface UpdatePublicacionData {
  titulo?: string;
  contenido?: string;
  tipo?: TipoPublicacion;
  imagen?: string | null;
}