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

export interface Expediente {
  id: number
  usuario_id: number
  nombre: string
  institucion: string
  descripcion: string
  tipo: TipoExpedienteEnum
  estado: TipoEstadoEnum
  url_expediente: string
  fecha_inicio: Date
  fecha_fin?: Date
}

export interface Certification {
  id: number
  name: string
  issuer: string
  date: string
  status: "verified" | "pending" | "failed" | "in-progress"
  credentialId: string
  score?: number
  level?: string
}
