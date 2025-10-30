from sqlalchemy.orm import Session
from backend.models.contenido_curso import ContenidoCurso
from backend.schemas.contenido_curso_schema import ContenidoCursoCreate, ContenidoCursoUpdate

def crear_contenido(db: Session, contenido: ContenidoCursoCreate) -> ContenidoCurso:
    db_contenido = ContenidoCurso(**contenido.model_dump())
    db.add(db_contenido)
    db.commit()
    db.refresh(db_contenido)
    return db_contenido

def obtener_contenido_por_curso(db: Session, curso_id: int):
    return db.query(ContenidoCurso).filter(
        ContenidoCurso.curso_id == curso_id
    ).order_by(ContenidoCurso.nivel, ContenidoCurso.orden).all()

def obtener_contenido_por_id(db: Session, contenido_id: int):
    return db.query(ContenidoCurso).filter(ContenidoCurso.id == contenido_id).first()

def actualizar_contenido(db: Session, contenido_id: int, contenido: ContenidoCursoUpdate) -> ContenidoCurso:
    db_contenido = obtener_contenido_por_id(db, contenido_id)
    if not db_contenido:
        return None
    for key, value in contenido.model_dump(exclude_unset=True).items():
        setattr(db_contenido, key, value)
    db.commit()
    db.refresh(db_contenido)
    return db_contenido

def eliminar_contenido(db: Session, contenido_id: int) -> bool:
    db_contenido = obtener_contenido_por_id(db, contenido_id)
    if not db_contenido:
        return False
    db.delete(db_contenido)
    db.commit()
    return True