# schemas/contenido_curso.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum 

class TipoContenido(str, Enum):
    texto = "texto"
    video = "video"
    archivo = "archivo"
    imagen = "imagen"


class ContenidoCursoBase(BaseModel):
    titulo: str
    tipo: TipoContenido  
    contenido: str
    orden: Optional[int] = 0
    nivel: int = 1
    parent_id: Optional[int] = None

class ContenidoCursoCreate(ContenidoCursoBase):
    curso_id: int

class ContenidoCursoUpdate(ContenidoCursoBase):
    pass

class BloqueContenidoBase(BaseModel):
    tipo: str
    contenido: str
    orden: int

class BloqueContenidoResponse(BloqueContenidoBase):
    id: int

    class Config:
        from_attributes = True

class ContenidoCursoResponse(BaseModel):
    id: int
    titulo: str
    tipo: str  # opcional: podrías eliminarlo más adelante
    contenido: str  # opcional: ya no se usará en lecciones
    orden: int
    nivel: int
    parent_id: int | None
    bloques: List[BloqueContenidoResponse] = []  # ✅ nuevo campo
    children: List["ContenidoCursoResponse"] = []

    class Config:
        from_attributes = True

class CursoContenidoConUsuario(BaseModel): 
    curso_user_id: int
    contenido: List[ContenidoCursoResponse]

    class Config:
        from_attributes = True