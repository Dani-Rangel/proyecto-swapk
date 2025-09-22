from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MensajeBase(BaseModel):
    chat_id: int
    id_usuario: int
    contenido: Optional[str] = None
    tipo: str = "texto"
    url_archivo: Optional[str] = None
    leido: bool = False

class MensajeCreate(MensajeBase):
    pass

class Mensaje(MensajeBase):
    id: int
    fecha: datetime

    class Config:
        orm_mode = True