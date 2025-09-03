from pydantic import BaseModel

class CursoHabilidadCreate(BaseModel):
    curso_id: int
    habilidad_id: int

class CursoHabilidadResponse(CursoHabilidadCreate):
    id: int
    habilidad_nombre: str

    class Config:
        from_attributes = True  # ✅ CORREGIDO PARA PYDANTIC V2
