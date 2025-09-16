// types/intercambio.ts

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
  fecha_creacion: string; // ISO string
}