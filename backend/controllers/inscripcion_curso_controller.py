# backend/routes/inscripcion_curso_controller.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from sqlalchemy.orm import joinedload
from models.Inscripciones_Cursos import InscripcionCurso as InscripcionCursoModel, EstadoInscripcion
from models.cursos import Curso
from models.usuarios import Usuario
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class InscripcionCursoCreate(BaseModel):
    curso_id: int
    usuario_id: int

class UsuarioResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        orm_mode = True

class InscripcionCursoResponse(BaseModel):
    id: int
    curso_id: int
    usuario_id: int
    fecha_inscripcion: datetime
    estado: str
    usuario: UsuarioResponse  # ← Añadido

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

@router.put("/inscripciones_cursos/{inscripcion_id}/aceptar")
def aceptar_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    inscripcion = db.query(InscripcionCursoModel).filter(InscripcionCursoModel.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    # Verificar que el usuario autenticado es el creador del curso
    curso = db.query(Curso).filter(Curso.id == inscripcion.curso_id).first()
    # Aquí deberías usar el usuario autenticado desde el token (ej. Depends(get_current_user))
    # Por simplicidad, asumimos que ya lo tienes. Si no, implementa autenticación JWT.

    # TODO: Reemplazar con lógica real de usuario autenticado
    # if current_user.id != curso.User_Id:
    #     raise HTTPException(status_code=403, detail="No autorizado")

    inscripcion.estado = EstadoInscripcion.Confirmado
    db.commit()
    return {"message": "Inscripción aceptada", "estado": inscripcion.estado}

@router.put("/inscripciones_cursos/{inscripcion_id}/finalizar")
def finalizar_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    inscripcion = db.query(InscripcionCursoModel).filter(InscripcionCursoModel.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    # TODO: Verificar que el creador del curso es quien finaliza

    inscripcion.estado = EstadoInscripcion.Finalizado
    db.commit()
    return {"message": "Inscripción finalizada", "estado": inscripcion.estado}    

@router.get("/inscripciones_cursos/curso/{curso_id}", response_model=List[InscripcionCursoResponse])
def get_inscripciones_by_curso(curso_id: int, db: Session = Depends(get_db)):
    inscripciones = (
        db.query(InscripcionCursoModel)
        .filter(InscripcionCursoModel.curso_id == curso_id)
        .options(joinedload(InscripcionCursoModel.usuario))  # ← Carga la relación
        .all()
    )
    return inscripciones   

    