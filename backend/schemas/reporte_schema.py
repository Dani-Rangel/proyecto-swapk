from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class EstadoReporte(str, Enum):
    Enviado = "Enviado"
    Revisado = "Revisado"
    Rechazado = "Rechazado"
    Resuelto = "Resuelto"
    Cerrado = "Cerrado"

class ReporteBase(BaseModel):
    tipo: str
    motivo: str

class ReporteCreate(ReporteBase):
    pass

class ReporteResponse(ReporteBase):
    id: int
    id_usuario: int
    estado: EstadoReporte
    fecha_reporte: datetime

    class Config:
        from_attributes = True