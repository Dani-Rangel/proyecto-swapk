from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

# -------------------------------
# Enums para Intercambio
# -------------------------------
class EstadoIntercambioEnum(str, Enum):
    Pendiente = "Pendiente"
    Confirmado = "Confirmado"
    Finalizado = "Finalizado"

class ModoIntercambioEnum(str, Enum):
    Virtual = "Virtual"
    Presencial = "Presencial"
    Hibrido = "Hibrido"

class NivelIntercambioEnum(str, Enum):
    Principiante = "Principiante"
    Intermedio = "Intermedio"
    Avanzado = "Avanzado"

class IdiomaIntercambioEnum(str, Enum):
    Ingles = "Ingles"
    Espanol = "Espanol"
    Portugues = "Portugues"

# -------------------------------
# Habilidad
# -------------------------------
class HabilidadBase(BaseModel):
    id: int
    nombre: str

    class Config:
        orm_mode = True

# -------------------------------
# Perfil
# -------------------------------
class PerfilBase(BaseModel):
    id: int
    ubicacion: Optional[str] = None
    foto_perfil: Optional[str] = None

    class Config:
        orm_mode = True

# -------------------------------
# Usuario (solo id y nombre)
# -------------------------------
class UsuarioBase(BaseModel):
    id: int
    nombre: str

    class Config:
        orm_mode = True

# -------------------------------
# Intercambio: Base
# -------------------------------
class IntercambioBase(BaseModel):
    id_usuario1: int
    id_perfil: int
    nivel: Optional[NivelIntercambioEnum] = None
    modo: Optional[ModoIntercambioEnum] = None
    disponibilidad: Optional[str] = None
    idioma: Optional[IdiomaIntercambioEnum] = None
    descripcion: Optional[str] = None
    valoracion: Optional[float] = 0.0
    estado_trueque: Optional[bool] = True
    estado: Optional[EstadoIntercambioEnum] = EstadoIntercambioEnum.Pendiente

# -------------------------------
# Intercambio: Create/Update
# -------------------------------
class IntercambioCreate(IntercambioBase):
    habilidades_ofrecidas_ids: Optional[List[int]] = []
    habilidades_buscadas_ids: Optional[List[int]] = []

# -------------------------------
# Intercambio: Response
# -------------------------------
class IntercambioResponse(IntercambioBase):
    id: int
    fecha_creacion: datetime

    usuario1: UsuarioBase
    perfil: PerfilBase

    habilidades_ofrecidas: List[HabilidadBase] = []
    habilidades_buscadas: List[HabilidadBase] = []

    class Config:
        orm_mode = True
