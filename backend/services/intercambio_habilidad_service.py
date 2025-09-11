from sqlalchemy.orm import Session
from backend.models import IntercambioHabilidad
from backend.schemas.intercambio_habilidad_schema import IntercambioHabilidadCreate
from typing import List, Optional

def crear_intercambio_habilidad(db: Session, intercambio_habilidad: IntercambioHabilidadCreate):
    nueva = IntercambioHabilidad(
        intercambio_id=intercambio_habilidad.intercambio_id,
        habilidad_id=intercambio_habilidad.habilidad_id,
        tipo=intercambio_habilidad.tipo
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

def obtener_habilidades_por_intercambio(db: Session, intercambio_id: int) -> List[IntercambioHabilidad]:
    return db.query(IntercambioHabilidad).filter(IntercambioHabilidad.intercambio_id == intercambio_id).all()

def obtener_intercambio_habilidad(db: Session, id: int) -> Optional[IntercambioHabilidad]:
    return db.query(IntercambioHabilidad).filter(IntercambioHabilidad.id == id).first()

def eliminar_intercambio_habilidad(db: Session, id: int) -> bool:
    ih = db.query(IntercambioHabilidad).filter(IntercambioHabilidad.id == id).first()
    if not ih:
        return False
    db.delete(ih)
    db.commit()
    return True

def actualizar_intercambio_habilidad(db: Session, id: int, data: IntercambioHabilidadCreate):
    ih = db.query(IntercambioHabilidad).filter(IntercambioHabilidad.id == id).first()
    if not ih:
        return None
    ih.intercambio_id = data.intercambio_id
    ih.habilidad_id = data.habilidad_id
    ih.tipo = data.tipo
    db.commit()
    db.refresh(ih)
    return ih
