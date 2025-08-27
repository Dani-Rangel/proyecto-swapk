from pydantic import BaseModel
from enum import Enum
from typing import Optional


class NivelEnum(str, Enum):
    PRINCIPIANTE = "Principiante"
    INTERMEDIO = "Intermedio"
    EXPERTO = "Experto"

class TipoEnum(str, Enum):
    OFRECE = "Ofrece"
    BUSCA = "Busca"

class PerfilHabilidadBase(BaseModel):
    Perfil_id: int
    habilidad_id: int
    tipo: TipoEnum
    nivel: NivelEnum

class PerfilHabilidadCreate(PerfilHabilidadBase):
    pass

class PerfilHabilidadResponse(PerfilHabilidadBase):
    id: int
    habilidad_nombre: Optional[str] = None

    class Config:
        orm_mode = True
