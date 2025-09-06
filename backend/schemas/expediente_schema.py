from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TipoExpedienteEnum(str, Enum):
    CV = "CV"
    CERTIFICADO = "Certificado"
    ACTA = "Acta"
    CARTA = "Carta"
    BECAS = "BECAS"
    CONTRATOS = "CONTRATOS"
    PROYECTOS = "PROYECTOS"


class TipoEstadoEnum(str, Enum):
    EN_PROCESO = "En proceso"
    VERIFICADO = "Verificado"
    PENDIENTE = "Pendiente"
    RECHAZADO = "Rechazado"


class ArchivoExpedienteCreate(BaseModel):
    nombre: str
    fecha_subida: Optional[datetime] = None

    class Config:
        orm_mode = True


class ExpedienteCreate(BaseModel):
    usuario_id: int
    nombre: str
    institucion: str
    descripcion: Optional[str]
    tipo: TipoExpedienteEnum
    estado: TipoEstadoEnum
    url_expediente: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    archivos: Optional[List[ArchivoExpedienteCreate]] = None

    class Config:
        orm_mode = True


class ArchivoExpedienteResponse(BaseModel):
    id: int
    nombre: str
    ruta: str
    fecha_subida: datetime

    class Config:
        orm_mode = True


class ExpedienteResponse(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    institucion: str
    descripcion: Optional[str]
    tipo: TipoExpedienteEnum
    estado: TipoEstadoEnum
    url_expediente: Optional[str]
    fecha_inicio: Optional[datetime]
    fecha_fin: Optional[datetime]
    archivos: Optional[List[ArchivoExpedienteResponse]] = []

    class Config:
        orm_mode = True


class ExpedienteUpdate(BaseModel):
    nombre: Optional[str]
    institucion: Optional[str]
    descripcion: Optional[str]
    tipo: Optional[TipoExpedienteEnum]
    estado: Optional[TipoEstadoEnum]
    url_expediente: Optional[str]
    fecha_inicio: Optional[datetime]
    fecha_fin: Optional[datetime]

    class Config:
        orm_mode = True

class EstadoUpdate(BaseModel):
    estado: TipoEstadoEnum
    class Config:
        orm_mode = True 
