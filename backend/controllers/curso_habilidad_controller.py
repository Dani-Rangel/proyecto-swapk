from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List  # ✅ NECESARIO

from backend.db.database import get_db
from backend.services.curso_service import delete_all_habilidades_por_curso
from backend.schemas.curso_habilidad_schema import CursoHabilidadCreate, CursoHabilidadResponse
from backend.services.curso_habilidad_service import get_habilidades_by_curso, create_curso_habilidad
from backend.models.habilidad import Habilidad

router = APIRouter(prefix="/curso_habilidad", tags=["Curso-Habilidad"])


@router.get("/curso/{curso_id}", response_model=List[CursoHabilidadResponse])
def get_habilidades_por_curso(curso_id: int, db: Session = Depends(get_db)):
    return get_habilidades_by_curso(db, curso_id)


@router.delete("/curso/{curso_id}")
def eliminar_habilidades_por_curso(curso_id: int, db: Session = Depends(get_db)):
    return delete_all_habilidades_por_curso(curso_id, db)


@router.post("", response_model=CursoHabilidadResponse)
def asociar_habilidad(data: CursoHabilidadCreate, db: Session = Depends(get_db)):
    nueva_asociacion = create_curso_habilidad(db, data)

    # Obtener nombre de la habilidad para incluir en la respuesta
    habilidad = db.query(Habilidad).filter_by(id=data.habilidad_id).first()
    return {
        "id": nueva_asociacion.id,
        "curso_id": nueva_asociacion.curso_id,
        "habilidad_id": nueva_asociacion.habilidad_id,
        "habilidad_nombre": habilidad.nombre if habilidad else ""
    }
