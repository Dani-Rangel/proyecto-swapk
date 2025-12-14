from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.bloque_contenido_schema import BloqueContenidoCreate, BloqueContenidoUpdate, BloqueContenidoResponse
from services.bloque_contenido_service import (
    crear_bloque,
    obtener_bloques_por_leccion,
    actualizar_bloque,
    eliminar_bloque,
)
from services.oauth2 import get_current_user
from models.usuarios import Usuario
from models.contenido_curso import ContenidoCurso
from models.cursos import Curso

router = APIRouter(prefix="/bloques", tags=["Bloques de Contenido"])


@router.post("/leccion/{leccion_id}", response_model=BloqueContenidoResponse, status_code=status.HTTP_201_CREATED)
def crear_bloque_contenido(
    leccion_id: int,
    bloque: BloqueContenidoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Verificar que la lección existe y es de nivel 2
    leccion = db.query(ContenidoCurso).filter(
        ContenidoCurso.id == leccion_id,
        ContenidoCurso.nivel == 2  # Solo lecciones
    ).first()
    if not leccion:
        raise HTTPException(status_code=404, detail="Lección no encontrada o inválida")

    # Verificar que el usuario es el creador del curso
    curso = db.query(Curso).filter(Curso.id == leccion.curso_id).first()
    if not curso or curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Crear el bloque
    nuevo_bloque = crear_bloque(db, bloque, leccion_id=leccion_id)
    return nuevo_bloque


@router.get("/leccion/{leccion_id}", response_model=list[BloqueContenidoResponse])
def obtener_bloques_de_leccion(
    leccion_id: int,
    db: Session = Depends(get_db)
):
    # Verificar que la lección existe
    leccion = db.query(ContenidoCurso).filter(
        ContenidoCurso.id == leccion_id,
        ContenidoCurso.nivel == 2
    ).first()
    if not leccion:
        raise HTTPException(status_code=404, detail="Lección no encontrada")

    bloques = obtener_bloques_por_leccion(db, leccion_id)
    return bloques


@router.put("/{bloque_id}", response_model=BloqueContenidoResponse)
def actualizar_bloque_contenido(
    bloque_id: int,
    bloque: BloqueContenidoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Obtener el bloque
    bloque_existente = db.query(ContenidoCurso).join(
        ContenidoCurso.bloques
    ).filter(
        ContenidoCurso.bloques.any(id=bloque_id)
    ).first()

    if not bloque_existente:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")

    # Verificar permisos (usuario es creador del curso)
    curso = db.query(Curso).filter(Curso.id == bloque_existente.curso_id).first()
    if not curso or curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Actualizar
    bloque_actualizado = actualizar_bloque(db, bloque_id, bloque)
    if not bloque_actualizado:
        raise HTTPException(status_code=404, detail="No se pudo actualizar el bloque")
    
    return bloque_actualizado


@router.delete("/{bloque_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_bloque_contenido(
    bloque_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Buscar la lección asociada al bloque
    leccion = db.query(ContenidoCurso).join(
        ContenidoCurso.bloques
    ).filter(
        ContenidoCurso.bloques.any(id=bloque_id)
    ).first()

    if not leccion:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")

    # Verificar permisos
    curso = db.query(Curso).filter(Curso.id == leccion.curso_id).first()
    if not curso or curso.User_Id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Eliminar
    if not eliminar_bloque(db, bloque_id):
        raise HTTPException(status_code=404, detail="Error al eliminar el bloque")
    
    return