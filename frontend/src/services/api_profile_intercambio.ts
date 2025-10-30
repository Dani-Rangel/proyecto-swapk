// services/api_Intercambios.ts
import axios from 'axios';
import { IntercambioResponse } from '@/services/intercambio'; // Ajusta la ruta

export interface Resena {
  id: number;
  autor: { id: number; nombre: string };
  destinatario: { id: number; nombre: string };
  calificacion: number;
  comentario: string;
  fecha: string;
}

export interface IntercambioConResena extends IntercambioResponse {
  resenas: Resena[]; // Asumimos que el backend las incluye
}

export const intercambioService = {
  // ✅ Obtener intercambios FINALIZADOS donde el usuario participó
  getIntercambiosConResenas: async (userId: number): Promise<IntercambioConResena[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get<IntercambioConResena[]>(
      `http://localhost:8000/intercambios/resenas/por-usuario/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }
};