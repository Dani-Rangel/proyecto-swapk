// services/api_profile_intercambio.ts

import axios from 'axios';

// -------------------------
// Tipos base
// -------------------------

export interface Usuario {
  id: number;
  nombre: string;
}

export interface HabilidadBase {
  id: number;
  nombre: string;
}

// -------------------------
// Propuesta aceptada (con usuario cargado)
// -------------------------

export interface PropuestaAceptada {
  id: number;
  id_usuario_interesado: number;
  aceptada: boolean;
  usuario_interesado: Usuario; // ✅ Relación cargada
}

// -------------------------
// Reseña (con autor y destinatario)
// -------------------------

export interface Resena {
  id: number;
  autor: Usuario;
  destinatario: Usuario;
  calificacion: number;
  comentario: string;
  fecha: string; // ISO 8601
}

// -------------------------
// Perfil (mínimo necesario)
// -------------------------

export interface Perfil {
  id: number;
  ubicacion?: string;
  foto_perfil?: string;
}

// -------------------------
// Enumeraciones (para tipado seguro)
// -------------------------

export type EstadoIntercambio = 'Pendiente' | 'Confirmado' | 'Finalizado';
export type ModoIntercambio = 'Virtual' | 'Presencial' | 'Hibrido';
export type NivelIntercambio = 'Principiante' | 'Intermedio' | 'Avanzado';
export type IdiomaIntercambio = 'Ingles' | 'Espanol' | 'Portugues';

// -------------------------
// Interfaz completa del intercambio con historial
// -------------------------

export interface IntercambioConResena {
  id: number;
  id_usuario1: number;
  id_perfil: number;
  nivel: NivelIntercambio | null;
  modo: ModoIntercambio | null;
  disponibilidad: string | null;
  idioma: IdiomaIntercambio | null;
  descripcion: string | null;
  valoracion: number;
  estado_trueque: boolean;
  estado: EstadoIntercambio;
  fecha_creacion: string;
  usuario1: Usuario;          // ✅ Creador
  perfil: Perfil;             // ✅ Perfil
  habilidades_ofrece: HabilidadBase[]; // ✅ Ofrece
  habilidades_busca: HabilidadBase[];  // ✅ Busca
  propuestas: PropuestaAceptada[];     // ✅ Con usuario_interesado
  resenas: Resena[];                   // ✅ Con autor y destinatario
  ya_participaste?: boolean;           // Opcional, útil para lógica
}

// -------------------------
// Servicio
// -------------------------

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token (recomendado)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }
  return config;
});

export const intercambioService = {
  getIntercambiosConResenas: async (userId: number): Promise<IntercambioConResena[]> => {
    const response = await api.get<IntercambioConResena[]>(
      `/intercambios/resenas/por-usuario/${userId}`
    );
    return response.data;
  },
};