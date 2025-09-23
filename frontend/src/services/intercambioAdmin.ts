// services/intercambioAdmin.ts 
import axios from "axios";

/** API Base **/
const API_URL = "http://localhost:8000";
const API_BASE = `${API_URL}/admin/intercambios`;

/** Enums (igual que en backend) **/
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

/** Relaciones **/
export interface UsuarioRelacionado {
  id: number;
  nombre: string;
  correo: string;
}

export interface PerfilRelacionado {
  id: number;
}

/** Modelo principal **/
export interface Intercambio {
  id: number;
  id_usuario1: number;
  id_perfil: number;
  nivel?: NivelIntercambio;
  modo?: ModoIntercambio;
  disponibilidad?: string;
  idioma?: IdiomaIntercambio;
  descripcion?: string;
  valoracion: number;
  estado_trueque: boolean;
  estado: EstadoIntercambio;
  fecha_creacion: string;

  // Relaciones
  usuario1: UsuarioRelacionado;
  perfil: PerfilRelacionado;
}

/** Formularios **/
export interface IntercambioForm {
  id_usuario1: number | null; // <-- CAMBIO IMPORTANTE
  id_perfil: number | null;   // <-- CAMBIO IMPORTANTE
  nivel?: NivelIntercambio;
  modo?: ModoIntercambio;
  disponibilidad?: string;
  idioma?: IdiomaIntercambio;
  descripcion?: string;
  valoracion: number;
  estado_trueque: boolean;
  estado: EstadoIntercambio;
}

export type IntercambioUpdateForm = Partial<IntercambioForm>;// todos opcionales

/** Servicio **/
export const IntercambioService = {
  async listar(): Promise<Intercambio[]> {
    const res = await axios.get<Intercambio[]>(API_BASE);
    return res.data;
  },

  async obtener(id: number): Promise<Intercambio> {
    const res = await axios.get<Intercambio>(`${API_BASE}/${id}`);
    return res.data;
  },

  async crear(data: IntercambioForm): Promise<Intercambio> {
    const res = await axios.post<Intercambio>(API_BASE, data);
    return res.data;
  },

  async actualizar(id: number, data: IntercambioUpdateForm): Promise<Intercambio> {
    const res = await axios.put<Intercambio>(`${API_BASE}/${id}`, data);
    return res.data;
  },

  async eliminar(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/${id}`);
  },
};