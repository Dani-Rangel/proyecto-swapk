from sqlalchemy.orm import Session
from backend.models.Curso_Habilidad import CursoHabilidad
from backend.models.habilidad import Habilidad
from backend.schemas.curso_habilidad_schema import CursoHabilidadCreate


def get_habilidades_by_curso(db: Session, curso_id: int):
    asociaciones = (
        db.query(CursoHabilidad, Habilidad.nombre)
        .join(Habilidad, CursoHabilidad.habilidad_id == Habilidad.id)
        .filter(CursoHabilidad.curso_id == curso_id)
        .all()
    )

    resultado = []
    for assoc, habilidad_nombre in asociaciones:
        resultado.append({
            "id": assoc.id,
            "curso_id": assoc.curso_id,
            "habilidad_id": assoc.habilidad_id,
            "habilidad_nombre": habilidad_nombre
        })

    return resultado


def create_curso_habilidad(db: Session, data: CursoHabilidadCreate):
    new_assoc = CursoHabilidad(**data.dict())
    db.add(new_assoc)
    db.commit()
    db.refresh(new_assoc)
    return new_assoc
