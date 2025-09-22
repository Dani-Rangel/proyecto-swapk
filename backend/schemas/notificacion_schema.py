from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class TipoNotificacion(str, Enum):
    Curso = "Curso"
    Intercambio = "Intercambio"  # corregido, sin espacio
    Mensaje = "Mensaje"
    Publicacion = "Publicacion"
    comentario = "comentario"

class NotificacionBase(BaseModel):
    contenido: str
    tipo: TipoNotificacion
    fecha: Optional[datetime] = None
    leido: Optional[bool] = False

class NotificacionCreate(NotificacionBase):
    id_usuario: int

class NotificacionOut(NotificacionBase):
    id: int
    id_usuario: int
    nombre_usuario: str

    class Config:
        from_attributes = True  # Pydantic v2 usa esto en lugar de orm_mode
