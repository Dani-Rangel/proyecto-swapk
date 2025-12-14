from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from db.database import get_db
from schemas.contenido_curso_schema import (
    ContenidoCursoCreate,
    ContenidoCursoUpdate,
    ContenidoCursoResponse,
    CursoContenidoConUsuario
)
from services.contenido_curso_service import (
    crear_contenido,
    actualizar_contenido,
    eliminar_contenido,
)
from services.oauth2 import get_current_user
from models.usuarios import Usuario
from models.cursos import Curso
from models.contenido_curso import ContenidoCurso

router = APIRouter(prefix="/contenido", tags=["Contenido del Curso"])


@router.post("/", response_model=ContenidoCursoResponse, status_code=status.HTTP_201_CREATED)
def crear_contenido_curso(
    contenido: ContenidoCursoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    curso = db.query(Curso).filter(Curso.id == contenido.curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    if curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return crear_contenido(db, contenido)


@router.get("/curso/{curso_id}", response_model=CursoContenidoConUsuario)
def leer_contenido_por_curso(curso_id: int, db: Session = Depends(get_db)):
    # Obtener el curso para sacar el user_id
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Cargar contenido del curso + sus bloques (para lecciones)
    contenido = (
        db.query(ContenidoCurso)
        .options(joinedload(ContenidoCurso.bloques))  # ✅ Carga los bloques
        .filter(ContenidoCurso.curso_id == curso_id)
        .order_by(ContenidoCurso.nivel, ContenidoCurso.orden)
        .all()
    )
    
    return CursoContenidoConUsuario(
        curso_user_id=curso.User_Id,
        contenido=contenido
    )


@router.put("/{contenido_id}", response_model=ContenidoCursoResponse)
def actualizar_contenido_curso(
    contenido_id: int,
    contenido: ContenidoCursoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_contenido = (
        db.query(ContenidoCurso)
        .options(joinedload(ContenidoCurso.bloques))
        .filter(ContenidoCurso.id == contenido_id)
        .first()
    )
    if not db_contenido:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    if db_contenido.curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    updated = actualizar_contenido(db, contenido_id, contenido)
    if not updated:
        raise HTTPException(status_code=404, detail="No se pudo actualizar")
    
    # Volver a cargar con bloques para la respuesta
    db.refresh(updated, attribute_names=["bloques"])
    return updated


@router.delete("/{contenido_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_contenido_curso(
    contenido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_contenido = db.query(ContenidoCurso).filter(ContenidoCurso.id == contenido_id).first()
    if not db_contenido:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    if db_contenido.curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if not eliminar_contenido(db, contenido_id):
        raise HTTPException(status_code=404, detail="Error al eliminar")
    return