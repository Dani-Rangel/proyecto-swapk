import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ ENUMS
export enum EstadoIntercambio {
  Pendiente = "Pendiente",
  Confirmado = "Confirmado",
  Finalizado = "Finalizado",
}
export enum ModoIntercambio {
  Virtual = "Virtual",
  Presencial = "Presencial",
  Hibrido = "Hibrido",
}
export enum NivelIntercambio {
  Principiante = "Principiante",
  Intermedio = "Intermedio",
  Avanzado = "Avanzado",
}
export enum IdiomaIntercambio {
  Ingles = "Ingles",
  Espanol = "Espanol",
  Portugues = "Portugues",
}

export type TipoHabilidad = "ofrece" | "busca";

// ✅ Interfaces auxiliares
export interface Usuario {
  id: number;
  nombre: string;
}
export interface Perfil {
  id: number;
  ubicacion?: string;
  foto_perfil?: string;
}

// Para enviar en la creación/edición
export interface HabilidadIntercambio {
  habilidad_id: number;
  tipo: TipoHabilidad;
}

// Lo que devuelve el backend (con nombre incluido)
export interface Habilidad {
  id: number;
  nombre: string;
  tipo: TipoHabilidad;
}

// ✅ Base de Intercambio (para enviar al backend)
export interface IntercambioBase {
  id_usuario1: number;
  id_perfil: number;
  nivel?: NivelIntercambio;
  modo?: ModoIntercambio;
  disponibilidad?: string;
  idioma?: IdiomaIntercambio;
  descripcion?: string;
  valoracion?: number;
  estado?: EstadoIntercambio;
  habilidades_ofrecidas_ids?: number[];
  habilidades_buscadas_ids?: number[];// solo ids y tipo
}

// ✅ Respuesta de Intercambio (lo que recibes del backend)
export interface IntercambioResponse {
  id: number;
  id_usuario1: number;
  id_perfil: number;
  nivel?: NivelIntercambio;
  modo?: ModoIntercambio;
  disponibilidad?: string;
  idioma?: IdiomaIntercambio;
  descripcion?: string;
  valoracion?: number;
  estado?: EstadoIntercambio;
  fecha_creacion: string;
  usuario1: Usuario;
  perfil: Perfil;
   habilidades_ofrecidas: Habilidad[];
  habilidades_buscadas: Habilidad[]; // ya viene con nombre y tipo
}

// -------------------------------
// FUNCIONES CRUD
// -------------------------------

// Crear un nuevo intercambio
export const crearIntercambio = async (
  data: IntercambioBase
): Promise<IntercambioResponse | null> => {
  try {
    const res = await api.post("/intercambios/", data);
    return res.data;
  } catch (error: any) {
    console.error(
      "❌ Error al crear intercambio:",
      error.response?.data || error.message
    );
    return null;
  }
};

// Actualizar un intercambio existente
export const actualizarIntercambio = async (
  id: number,
  data: IntercambioBase
): Promise<IntercambioResponse | null> => {
  try {
    const res = await api.put(`/intercambios/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al actualizar intercambio ${id}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Obtener todos los intercambios
export const obtenerIntercambios = async (): Promise<IntercambioResponse[]> => {
  try {
    const res = await api.get("/intercambios/");
    return res.data;
  } catch (error: any) {
    console.error(
      "❌ Error al obtener intercambios:",
      error.response?.data || error.message
    );
    return [];
  }
};

// Obtener un intercambio por ID
export const obtenerIntercambio = async (
  id: number
): Promise<IntercambioResponse | null> => {
  try {
    const res = await api.get(`/intercambios/${id}`);
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al obtener intercambio ${id}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Eliminar un intercambio
export const eliminarIntercambio = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/intercambios/${id}`);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Error al eliminar intercambio ${id}:`,
      error.response?.data || error.message
    );
    return false;
  }
};

// -------------------------------
// FUNCIONES HABILIDADES
// -------------------------------

export const obtenerHabilidades = async (): Promise<Habilidad[]> => {
  try {
    const res = await api.get("/habilidades");
    return res.data;
  } catch (error: any) {
    console.error(
      "❌ Error al obtener habilidades:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const actualizarHabilidad = async (
  id: number,
  nombre: string
): Promise<Habilidad | null> => {
  try {
    const res = await api.put(`/habilidades/${id}`, { nombre });
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al actualizar habilidad ${id}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

export const eliminarHabilidad = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/habilidades/${id}`);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Error al eliminar habilidad ${id}:`,
      error.response?.data || error.message
    );
    return false;
  }
};

// Eliminar todas las habilidades asociadas a un intercambio
export const eliminarHabilidadesPorIntercambio = async (
  idIntercambio: number
): Promise<boolean> => {
  try {
    await api.delete(`/intercambios/${idIntercambio}/habilidades`);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Error al eliminar habilidades del intercambio ${idIntercambio}:`,
      error.response?.data || error.message
    );
    return false;
  }
};
