// services/api_Skills.ts
import axios from "axios";

// URL base del backend (FastAPI)
const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar token si estás usando autenticación JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tipos de datos

export interface Skill {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface SkillAssociation {
  Perfil_id: number;
  habilidad_id: number;
  tipo: "Ofrece" | "Busca";
  nivel: "Principiante" | "Intermedio" | "Experto";
}

export interface SkillAssociationResponse {
  id: number;
  Perfil_id: number;
  habilidad_id: number;
  habilidad_nombre: string;
  tipo: "Ofrece" | "Busca";
  nivel: "Principiante" | "Intermedio" | "Experto";
}

export const skillsAPI = {
  // Obtener todas las habilidades
  getSkills: async (): Promise<Skill[]> => {
    const response = await api.get('/habilidades');
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data.results)) {
      return data.results;
    } else {
      console.error("⚠️ Formato inesperado en /habilidades:", data);
      return [];
    }
  },

  // Obtener habilidades asociadas a un perfil
  getPerfilSkills: async (perfilId: number): Promise<SkillAssociationResponse[]> => {
    const response = await api.get(`/perfil_habilidad/${perfilId}`);
    return response.data;
  },

  // Asociar habilidad a un perfil
  associateSkill: async (association: SkillAssociation): Promise<SkillAssociationResponse> => {
    const response = await api.post('/perfil_habilidad', association);
    return response.data;
  },

  // Eliminar asociación de habilidad
  deleteSkillAssociation: async (id: number): Promise<void> => {
    await api.delete(`/perfil_habilidad/${id}`);
  }
};

