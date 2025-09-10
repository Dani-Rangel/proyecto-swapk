from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.perfil_habilidad_schema import PerfilHabilidadCreate, PerfilHabilidadResponse
from backend.services import perfil_habilidad_service
from backend.models.habilidad import Habilidad
from typing import List
from backend.models.perfil_habilidad import PerfilHabilidad

router = APIRouter()


@router.get("/perfil_habilidad/{perfil_id}", response_model=List[PerfilHabilidadResponse])
def get_perfil_habilidades(perfil_id: int, db: Session = Depends(get_db)):
    return perfil_habilidad_service.get_habilidades_by_perfil(db, perfil_id)

@router.post("/perfil_habilidad", response_model=PerfilHabilidadResponse)
def create_perfil_habilidad(data: PerfilHabilidadCreate, db: Session = Depends(get_db)):
    new_assoc = perfil_habilidad_service.create_perfil_habilidad(db, data)

    # 🔥 Extraer el nombre de la habilidad (JOIN manual)
    habilidad = db.query(Habilidad).filter(Habilidad.id == new_assoc.habilidad_id).first()
    habilidad_nombre = habilidad.nombre if habilidad else None

    # 🔁 Devolver respuesta enriquecida
    return {
        "id": new_assoc.id,
        "Perfil_id": new_assoc.Perfil_id,
        "habilidad_id": new_assoc.habilidad_id,
        "tipo": new_assoc.tipo,
        "nivel": new_assoc.nivel,
        "habilidad_nombre": habilidad_nombre
    }

@router.delete("/perfil_habilidad/{id}")
def delete_perfil_habilidad(id: int, db: Session = Depends(get_db)):
    asociacion = db.query(PerfilHabilidad).filter(PerfilHabilidad.id == id).first()
    
    if not asociacion:
        raise HTTPException(status_code=404, detail="Asociación no encontrada")

    db.delete(asociacion)
    db.commit()
    return {"msg": "Asociación eliminada correctamente"}   