# services/bloque_contenido_service.py
from sqlalchemy.orm import Session
from models.bloque_contenido import BloqueContenido
from schemas.bloque_contenido_schema import BloqueContenidoCreate, BloqueContenidoUpdate

def crear_bloque(db: Session, bloque: BloqueContenidoCreate, leccion_id: int) -> BloqueContenido:
    db_bloque = BloqueContenido(**bloque.model_dump(), leccion_id=leccion_id)
    db.add(db_bloque)
    db.commit()
    db.refresh(db_bloque)
    return db_bloque

def obtener_bloques_por_leccion(db: Session, leccion_id: int):
    return db.query(BloqueContenido).filter(BloqueContenido.leccion_id == leccion_id).order_by(BloqueContenido.orden).all()

def actualizar_bloque(db: Session, bloque_id: int, bloque: BloqueContenidoUpdate) -> BloqueContenido:
    db_bloque = db.query(BloqueContenido).filter(BloqueContenido.id == bloque_id).first()
    if not db_bloque:
        return None
    for key, value in bloque.model_dump(exclude_unset=True).items():
        setattr(db_bloque, key, value)
    db.commit()
    db.refresh(db_bloque)
    return db_bloque

def eliminar_bloque(db: Session, bloque_id: int) -> bool:
    db_bloque = db.query(BloqueContenido).filter(BloqueContenido.id == bloque_id).first()
    if not db_bloque:
        return False
    db.delete(db_bloque)
    db.commit()
    return True
