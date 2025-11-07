from pydantic import BaseModel,  ConfigDict
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
# Enum para tipo habilidad
# -------------------------------
class TipoHabilidadEnum(str, Enum):
    ofrece = "ofrece"
    busca = "busca"

# -------------------------------
# Habilidad
# -------------------------------
class HabilidadBase(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)

# -------------------------------
# IntercambioHabilidad
# -------------------------------
class IntercambioHabilidadBase(BaseModel):
    tipo: TipoHabilidadEnum

class IntercambioHabilidadCreate(IntercambioHabilidadBase):
    habilidad_id: int

class IntercambioHabilidadResponse(BaseModel):
    id: int
    habilidad: HabilidadBase

    model_config = ConfigDict(from_attributes=True)

# -------------------------------
# Perfil
# -------------------------------
class PerfilBase(BaseModel):
    id: int
    ubicacion: Optional[str] = None
    foto_perfil: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UsuarioBase(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)

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

    class Config:
        orm_mode = True

class PropuestaAceptada(BaseModel):
    id: int
    id_usuario_interesado: int
    aceptada: bool
    usuario_interesado: UsuarioBase

    class Config:
        orm_mode = True  

class ResenaResponse(BaseModel):
    id: int
    autor: UsuarioBase
    destinatario: UsuarioBase
    calificacion: float
    comentario: str
    fecha: datetime

    model_config = ConfigDict(from_attributes=True)   

class UsuarioBase(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)                 

# -------------------------------
# Intercambio: Response extendido con habilidades separadas
# -------------------------------
class IntercambioConHabilidadesSeparadas(BaseModel):
    id: int
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
    fecha_creacion: datetime
    usuario1: UsuarioBase
    perfil: PerfilBase
    habilidades_ofrece: List[HabilidadBase] = []
    habilidades_busca: List[HabilidadBase] = []
    propuestas: List[PropuestaAceptada] = []
    reseñas: List[ResenaResponse] = []  # ← ¡Clave!
    ya_participaste: bool = False

    model_config = ConfigDict(from_attributes=True)

class PropuestaResumen(BaseModel):
    id_intercambio: int
    id_propuesta: int
    id_usuario_interesado: int
    aceptada: bool
    

    class Config:
        orm_mode = True   

# backend/schemas/intercambio_schema.py

class ResenaCreate(BaseModel):
    intercambio_id: int
    calificacion: float  # ❌ NO necesitas pasar autor_id ni destinatario_id desde el frontend
    comentario: str

    class Config:
        orm_mode = True


        
