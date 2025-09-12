// services/expediente.ts
import axios from 'axios';

export enum TipoExpedienteEnum {
  CV = "CV",
  CERTIFICADO = "Certificado",
  ACTA = "Acta",
  CARTA = "Carta",
  BECAS = "BECAS",
  CONTRATOS = "CONTRATOS",
  PROYECTOS = "PROYECTOS",
}

export enum TipoEstadoEnum {
  EN_PROCESO = "En proceso",
  VERIFICADO = "Verificado",
  PENDIENTE = "Pendiente",
  RECHAZADO = "Rechazado",
}

export interface ArchivoExpedienteCreate {
  nombre: string;
  // No ruta, se asigna en backend
}

export interface ArchivoExpedienteResponse {
  id: number;
  nombre: string;
  ruta: string;
  fecha_subida: string;
}

export interface Expediente {
  id: number;
  usuario_id: number;
  nombre: string;
  institucion: string;
  descripcion?: string;
  tipo: TipoExpedienteEnum;
  estado: TipoEstadoEnum;
  url_expediente?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  archivos?: ArchivoExpedienteResponse[];
}

export interface ExpedienteCreate {
  usuario_id: number;
  nombre: string;
  institucion: string;
  descripcion?: string;
  tipo: TipoExpedienteEnum;
  estado: TipoEstadoEnum;
  url_expediente?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  archivos?: ArchivoExpedienteCreate[];
}

export interface ExpedienteUpdate {
  nombre?: string;
  institucion?: string;
  descripcion?: string;
  tipo?: TipoExpedienteEnum;
  estado?: TipoEstadoEnum;
  url_expediente?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

const API_BASE_URL = 'http://localhost:8000/expedientes';

export const expedienteService = {
  listarPorUsuario: async (usuarioId: number): Promise<Expediente[]> => {
    const response = await axios.get(`${API_BASE_URL}/usuario/${usuarioId}`);
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Expediente> => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  crear: async (data: ExpedienteCreate): Promise<Expediente> => {
    console.log('Payload:', data);
    const response = await axios.post(API_BASE_URL, data);
    return response.data;
  },

  actualizar: async (id: number, data: ExpedienteUpdate): Promise<Expediente> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`);
  },

  subirArchivo: async (expedienteId: number, file: File): Promise<ArchivoExpedienteResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/${expedienteId}/archivo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
};