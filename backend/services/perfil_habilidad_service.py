from sqlalchemy.orm import Session
from models.perfil_habilidad import perfilHabilidad
from models.habilidad import Habilidad
from schemas.perfil_habilidad_schema import PerfilHabilidadCreate, PerfilHabilidadResponse

def get_habilidades_by_perfil(db: Session, perfil_id: int):
    asociaciones = (
        db.query(perfilHabilidad, Habilidad.nombre)
        .join(Habilidad, perfilHabilidad.habilidad_id == Habilidad.id)
        .filter(perfilHabilidad.Perfil_id == perfil_id)
        .all()
    )

    resultado = []
    for assoc, habilidad_nombre in asociaciones:
        resultado.append({
            "id": assoc.id,
            "Perfil_id": assoc.Perfil_id,
            "habilidad_id": assoc.habilidad_id,
            "tipo": assoc.tipo,
            "nivel": assoc.nivel,
            "habilidad_nombre": habilidad_nombre
        })

    return resultado

def create_perfil_habilidad(db: Session, data: PerfilHabilidadCreate):
    new_assoc = perfilHabilidad(**data.dict())
    db.add(new_assoc)
    db.commit()
    db.refresh(new_assoc)
    return new_assoc
