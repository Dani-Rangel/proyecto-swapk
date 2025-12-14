from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from services.oauth2 import get_current_user
from models import ResenaGeneral, Usuario
from pydantic import BaseModel
from typing import List
from schemas.resena_schema import UsuarioResena, ResenaGeneralResponse

router = APIRouter(prefix="/resenas", tags=["Reseñas Generales"])

class ResenaGeneralCreate(BaseModel):
    calificacion: float
    comentario: str


@router.post("/generales", response_model=ResenaGeneralResponse)
def crear_resena_general(
    resena: ResenaGeneralCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not (1 <= resena.calificacion <= 5):
        raise HTTPException(status_code=400, detail="Calificación debe estar entre 1 y 5")
    if len(resena.comentario.strip()) < 5:
        raise HTTPException(status_code=400, detail="El comentario debe tener al menos 5 caracteres")

    nueva = ResenaGeneral(
        autor_id=current_user.id,
        calificacion=resena.calificacion,
        comentario=resena.comentario.strip()
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/generales", response_model=List[ResenaGeneralResponse])
def obtener_resenas_generales(db: Session = Depends(get_db)):
    return db.query(ResenaGeneral).order_by(ResenaGeneral.fecha.desc()).all()
