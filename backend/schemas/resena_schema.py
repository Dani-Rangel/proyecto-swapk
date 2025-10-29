from pydantic import BaseModel
from datetime import datetime

class UsuarioResena(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True  # Permite usar objetos SQLAlchemy

class ResenaGeneralResponse(BaseModel):
    id: int
    autor: UsuarioResena      # ← Usa el modelo anidado
    calificacion: float
    comentario: str
    fecha: datetime           # ← FastAPI serializará esto a ISO string

    class Config:
        from_attributes = True