from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# =========================
# Curso Base
# =========================
class CursoBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    objetivo: Optional[str] = None
    img_Cursos: Optional[str] = None

# =========================
# Curso Create / Update
# =========================
class CursoCreate(CursoBase):
    User_Id: int

class CursoUpdate(CursoBase):
    pass

# =========================
# Respuestas relacionadas
# =========================
class CursoHabilidadResponse(BaseModel):
    id: int
    habilidad_nombre: str
    tipo: Optional[str] = None

    class Config:
        from_attributes = True  # Cambiado de orm_mode

class UsuarioResponse(BaseModel):
    nombre: str

    class Config:
        from_attributes = True  # Cambiado de orm_mode

class AttachmentResponse(BaseModel):
    id: int
    file_url: str
    file_name: str
    file_size: int
    fecha_subida: datetime

    class Config:
        from_attributes = True  # Cambiado de orm_mode

# =========================
# Curso Response
# =========================
class CursoResponse(CursoBase):
    id: int
    User_Id: int
    usuario: Optional[UsuarioResponse] = None
    habilidades: List[CursoHabilidadResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True  # Cambiado de orm_mode