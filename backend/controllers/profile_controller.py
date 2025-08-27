from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.perfil import Perfil
from backend.models.usuarios import Usuario
from backend.services.oauth2 import get_current_user

router = APIRouter(prefix="/perfil", tags=["Perfil"])

@router.get("/me")
def get_my_perfil(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == current_user.id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {
        "id": perfil.id,
        "id_usuario": perfil.id_usuario,
        "nombre": perfil.nombre,
        "correo": perfil.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "Tel": perfil.Tel,
        "foto_perfil": perfil.foto_perfil or "/img/cat_profile.jpg"
    }

# --- Aquí agregas la nueva ruta ---
@router.get("/usuario/{id}")
def get_perfil_by_user_id(id: int, db: Session = Depends(get_db)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {
        "id": perfil.id,
        "id_usuario": perfil.id_usuario,
        "nombre": perfil.nombre,
        "correo": perfil.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "Tel": perfil.Tel,
        "foto_perfil": perfil.foto_perfil or "/img/cat_profile.jpg"
    }
