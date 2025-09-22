import axios from 'axios';

// 🔧 Usa la variable del entorno o una URL por defecto
const API_BASE_URL = 'http://localhost:8000';

export type TipoNotificacion = 'Curso' | 'Intercambio' | 'Mensaje' | 'Publicacion' | 'comentario';

export interface Notificacion {
  id: number;
  id_usuario: number;
  contenido: string;
  tipo: TipoNotificacion;
  fecha: string;
  leido: boolean;
  nombre_usuario: string;
}

export interface NotificacionCreate {
  id_usuario: number;
  contenido: string;
  tipo: TipoNotificacion;
  fecha?: string;
  leido?: boolean;
}

const notificacionAPI = {
  // Obtener todas las notificaciones de un usuario
  getByUser: async (userId: number): Promise<Notificacion[]> => {
    const response = await axios.get(`${API_BASE_URL}/notificaciones/${userId}`);
    return response.data;
  },

  // Crear nueva notificación
  create: async (data: NotificacionCreate): Promise<Notificacion> => {
    const response = await axios.post(`${API_BASE_URL}/notificaciones/`, data);
    return response.data;
  },

  // Marcar como leída
  marcarLeida: async (notificacionId: number): Promise<Notificacion> => {
    const response = await axios.put(`${API_BASE_URL}/notificaciones/${notificacionId}/leido`);
    return response.data;
  },

  // Eliminar notificación
  eliminar: async (notificacionId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notificaciones/${notificacionId}`);
  }
};

export default notificacionAPI;
