from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.models.Inscripciones_Cursos import InscripcionCurso as InscripcionCursoModel

from db.database import get_db
from schemas.curso_schema import CursoCreate, CursoUpdate, CursoResponse
from services.curso_service import (
    create_curso_service,
    get_cursos_service,
    get_curso_service,
    update_curso_service,
    delete_curso_service
)

router = APIRouter(prefix="/cursos", tags=["Cursos"])

@router.post("/", response_model=CursoResponse)
def create_curso(curso: CursoCreate, db: Session = Depends(get_db)):
    return create_curso_service(curso, db)

@router.get("/", response_model=List[CursoResponse])
def get_cursos(db: Session = Depends(get_db)):
    return get_cursos_service(db)

@router.get("/{curso_id}", response_model=CursoResponse)
def get_curso(curso_id: int, db: Session = Depends(get_db)):
    return get_curso_service(curso_id, db)

@router.put("/{curso_id}", response_model=CursoResponse)
def update_curso(curso_id: int, curso_data: CursoUpdate, db: Session = Depends(get_db)):
    return update_curso_service(curso_id, curso_data, db)

@router.delete("/{curso_id}")
def delete_curso(curso_id: int, db: Session = Depends(get_db)):
    return delete_curso_service(curso_id, db)

@router.get("/inscritos-count/{curso_id}")
def get_inscritos_count(curso_id: int, db: Session = Depends(get_db)):
    count = db.query(InscripcionCursoModel).filter(
        InscripcionCursoModel.curso_id == curso_id,
        InscripcionCursoModel.estado == "Confirmado"
    ).count()
    return {"count": count}    
