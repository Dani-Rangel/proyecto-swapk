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
# Nuevo schema para entrada de archivos
# =========================
class AttachmentInput(BaseModel):
    file_url: str
    file_name: str
    file_size: int

# =========================
# Curso Create / Update
# =========================
class CursoCreate(CursoBase):
    user_id: int
    habilidades_ids: List[int] = []
    attachments: Optional[List[AttachmentInput]] = None  # Cambio de nombre correcto

class CursoUpdate(CursoBase):
    habilidades_ids: List[int] = []
    attachments: Optional[List[AttachmentInput]] = None  # Cambio de nombre correcto

# =========================
# Respuestas relacionadas
# =========================
class CursoHabilidadResponse(BaseModel):
    id: int
    habilidad_nombre: str
    tipo: Optional[str] = None

    class Config:
        orm_mode = True  # corregido

class UsuarioResponse(BaseModel):
    nombre: str

    class Config:
        orm_mode = True  # corregido

class AttachmentResponse(BaseModel):
    id: int
    file_url: str
    file_name: str
    file_size: int
    fecha_subida: datetime

    class Config:
        orm_mode = True  # corregido

# =========================
# Curso Response
# =========================
class CursoResponse(CursoBase):
    id: int
    user_id: int
    usuario: Optional[UsuarioResponse] = None
    habilidades: List[CursoHabilidadResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        orm_mode = True  # corregido
