from pydantic import BaseModel
from typing import Optional
from enum import Enum

class TipoHabilidadEnum(str, Enum):
    ofrece = "ofrece"
    busca = "busca"

class IntercambioHabilidadBase(BaseModel):
    tipo: TipoHabilidadEnum

class IntercambioHabilidadCreate(IntercambioHabilidadBase):
    habilidad_id: int

class HabilidadSimple(BaseModel):
    id: int
    nombre: str

    class Config:
        orm_mode = True

class IntercambioHabilidadResponse(IntercambioHabilidadBase):
    id: int
    habilidad: HabilidadSimple

    class Config:
        orm_mode = True