from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# habilidad_schema.py
class HabilidadCreateDTO(BaseModel):
    nombre: str
    descripcion: str
    categoria: str

class HabilidadOut(BaseModel):
    id: int
    nombre: str
    descripcion: str
    categoria: str

    model_config = {
        "from_attributes": True
    }


     
