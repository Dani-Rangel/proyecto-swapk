# backend/routes/inscripcion_curso_controller.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.Inscripciones_Cursos import InscripcionCurso as InscripcionCursoModel
from backend.models.cursos import Curso
from backend.models.usuarios import Usuario
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class InscripcionCursoCreate(BaseModel):
    curso_id: int
    usuario_id: int

class InscripcionCursoResponse(BaseModel):
    id: int
    curso_id: int
    usuario_id: int
    fecha_inscripcion: datetime
    estado: str

    class Config:
        orm_mode = True

@router.post("/inscripciones_cursos/", response_model=InscripcionCursoResponse)
def create_inscripcion(inscripcion: InscripcionCursoCreate, db: Session = Depends(get_db)):
    # Verificar que el curso exista
    curso = db.query(Curso).filter(Curso.id == inscripcion.curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    # Verificar que el usuario exista
    usuario = db.query(Usuario).filter(Usuario.id == inscripcion.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Crear inscripción
    nueva_inscripcion = InscripcionCursoModel(
        curso_id=inscripcion.curso_id,
        usuario_id=inscripcion.usuario_id,
        estado="Pendiente"
    )
    db.add(nueva_inscripcion)
    db.commit()
    db.refresh(nueva_inscripcion)
    return nueva_inscripcion

@router.get("/inscripciones_cursos/usuario/{user_id}", response_model=List[InscripcionCursoResponse])
def get_inscripciones_by_user(user_id: int, db: Session = Depends(get_db)):
    inscripciones = db.query(InscripcionCursoModel).filter(InscripcionCursoModel.usuario_id == user_id).all()
    return inscripciones

@router.get("/inscripciones_cursos/check/{curso_id}/{user_id}")
def check_inscripcion(curso_id: int, user_id: int, db: Session = Depends(get_db)):
    inscripcion = db.query(InscripcionCursoModel).filter(
        InscripcionCursoModel.curso_id == curso_id,
        InscripcionCursoModel.usuario_id == user_id
    ).first()
    return {"inscrito": inscripcion is not None}

@router.delete("/inscripciones_cursos/{inscripcion_id}", status_code=204)
def delete_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    inscripcion = db.query(InscripcionCursoModel).filter(InscripcionCursoModel.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    db.delete(inscripcion)
    db.commit()
    return