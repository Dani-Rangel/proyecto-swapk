from sqlalchemy.orm import Session
from backend.models.habilidad import Habilidad
from backend.schemas.habilidad_schema import HabilidadCreateDTO

def get_all_habilidades(db: Session):
    return db.query(Habilidad).all()

# habilidad_service.py
def create_habilidad(db: Session, habilidad: HabilidadCreateDTO):
    nueva_habilidad = Habilidad(
        nombre=habilidad.nombre,
        descripcion=habilidad.descripcion,
        categoria=habilidad.categoria
    )
    db.add(nueva_habilidad)
    db.commit()
    db.refresh(nueva_habilidad)
    return nueva_habilidad
