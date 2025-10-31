# schemas/bloque_contenido.py
from pydantic import BaseModel
from typing import List, Optional

class BloqueContenidoCreate(BaseModel):
    tipo: str
    contenido: str
    orden: Optional[int] = 0

class BloqueContenidoUpdate(BloqueContenidoCreate):
    pass

class BloqueContenidoResponse(BaseModel):
    id: int
    tipo: str
    contenido: str
    orden: int

    class Config:
        from_attributes = True