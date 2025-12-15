// services/api_CursoHabilidad.ts
import axios from "axios";

const API_BASE_URL = "https://backend-production-fc5e.up.railway.app";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tipos
export interface CursoHabilidad {
  id: number;
  curso_id: number;
  habilidad_id: number;
  habilidad_nombre?: string;
}

export interface CursoHabilidadCreate {
  curso_id: number;
  habilidad_id: number;
}

export interface HabilidadOption {
  id: number;
  value: string;
  label: string;
}

// API
export const cursoHabilidadAPI = {
  // Obtener habilidades asociadas a un curso
  getCursoHabilidades: async (cursoId: number): Promise<CursoHabilidad[]> => {
    const res = await api.get(`/curso_habilidad/curso/${cursoId}`);
    return res.data;
  },

  // Asociar una habilidad a un curso
  associateHabilidad: async (data: CursoHabilidadCreate): Promise<CursoHabilidad> => {
    const res = await api.post(`/curso_habilidad`, data);
    return res.data;
  },

  // Eliminar TODAS las habilidades de un curso
  deleteAllForCurso: async (cursoId: number): Promise<void> => {
    await api.delete(`/curso_habilidad/curso/${cursoId}`);
  },
};
