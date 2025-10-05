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
}

// Lo que devuelve el backend (con nombre incluido)
export interface Habilidad {
  id: number;
  nombre: string;
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
   habilidades_ofrece: Habilidad[];
  habilidades_busca: Habilidad[];
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

// Obtener todas las habilidades (nueva función)
export const obtenerTodasHabilidades = async (): Promise<Habilidad[]> => {
  try {
    const res = await api.get("/habilidades") // ajusta la ruta si es diferente
    return res.data
  } catch (error: any) {
    console.error("❌ Error al obtener habilidades:", error.response?.data || error.message)
    return []
  }
}


// Obtener habilidades asociadas a un intercambio
export const obtenerHabilidadesPorIntercambio = async (
  idIntercambio: number
): Promise<Habilidad[]> => {
  try {
    const res = await api.get(`/intercambio_habilidades/intercambio/${idIntercambio}`);
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al obtener habilidades del intercambio ${idIntercambio}:`,
      error.response?.data || error.message
    );
    return [];
  }
};

// Crear una habilidad asociada a un intercambio
export const crearIntercambioHabilidad = async (
  intercambio_id: number,
  habilidad_id: number,
  tipo: TipoHabilidad
): Promise<Habilidad | null> => {
  try {
    const res = await api.post(`/intercambio_habilidades/`, {
      intercambio_id,
      habilidad_id,
      tipo,
    });
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al crear habilidad para intercambio ${intercambio_id}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Actualizar una habilidad asociada a un intercambio
export const actualizarIntercambioHabilidad = async (
  id: number,
  intercambio_id: number,
  habilidad_id: number,
  tipo: TipoHabilidad
): Promise<Habilidad | null> => {
  try {
    const res = await api.put(`/intercambio_habilidades/${id}`, {
      intercambio_id,
      habilidad_id,
      tipo,
    });
    return res.data;
  } catch (error: any) {
    console.error(
      `❌ Error al actualizar habilidad asociada ${id}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Eliminar habilidad asociada a un intercambio
export const eliminarIntercambioHabilidad = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/intercambio_habilidades/${id}`);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Error al eliminar habilidad asociada ${id}:`,
      error.response?.data || error.message
    );
    return false;
  }
};


