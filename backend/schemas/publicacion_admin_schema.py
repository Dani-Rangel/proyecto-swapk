# schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import List
import enum

# ===== Enums =====
class TipoPublicacion(str, enum.Enum):
    Intercambio = "Intercambio"
    Curso = "Curso"
    Pregunta = "Pregunta"
    Logro = "Logro"

# ===== Schemas Base =====
class PublicacionBase(BaseModel):
    titulo: str
    contenido: str
    tipo: TipoPublicacion
    imagen: Optional[str] = None
    id_usuario: int
    id_perfil: Optional[int] = None

class PublicacionCreate(PublicacionBase):
    pass

class PublicacionUpdate(BaseModel):
    titulo: Optional[str] = None
    contenido: Optional[str] = None
    tipo: Optional[TipoPublicacion] = None
    imagen: Optional[str] = None
    id_usuario: Optional[int] = None
    id_perfil: Optional[int] = None

# ===== Subesquemas para relaciones =====
class UsuarioOut(BaseModel):
    id: int
    nombre: str
    correo: str

    class Config:
        orm_mode = True

class PerfilOut(BaseModel):
    id: int
    # Añade otros campos si los tienes, ej: nombre, foto, etc.
    class Config:
        orm_mode = True

# ===== Schema de salida con relaciones =====
class PublicacionOut(BaseModel):
    id: int
    titulo: str
    contenido: str
    tipo: TipoPublicacion
    imagen: Optional[str]
    fecha_creacion: datetime
    id_usuario: int
    id_perfil: Optional[int]
    usuario: UsuarioOut
    perfil: Optional[PerfilOut]

    class Config:
        orm_mode = True