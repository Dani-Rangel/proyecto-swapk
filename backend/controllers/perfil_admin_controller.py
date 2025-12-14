from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.perfil import Perfil
from models.usuarios import Usuario
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/admin", tags=["Perfiles Admin"])

# ✅ Schema de salida CORREGIDO: Solo incluye el ID
class PerfilOut(BaseModel):
    id: int
    # nombre: str  <-- ¡ELIMINA ESTA LÍNEA! Tu modelo Perfil no tiene este campo.
    class Config:
        orm_mode = True

@router.get("/perfiles", response_model=List[PerfilOut])
def listar_perfiles(db: Session = Depends(get_db)):
    # Simplemente devuelve todos los perfiles. El frontend solo necesita el ID.
    perfiles = db.query(Perfil).all()
    return perfiles
