from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models import Expediente, Usuario
from backend.schemas.expediente_schema import EstadoUpdate
from backend.services.expediente_service import actualizar_expediente

router = APIRouter(
    prefix="/moderador",
    tags=["Moderador"]
)

@router.get("/expedientes")
def listar_todos_expedientes(db: Session = Depends(get_db)):
    resultados = (
        db.query(Expediente, Usuario)
        .join(Usuario, Expediente.usuario_id == Usuario.id)
        .all()
    )

    expedientes = []
    for expediente, usuario in resultados:
        expedientes.append({
            "id": expediente.id,
            "nombre": expediente.nombre,
            "institucion": expediente.institucion,
            "estado": expediente.estado.value if expediente.estado else None,
            "tipo": expediente.tipo.value if expediente.tipo else None,
            "usuario_nombre": usuario.nombre,
            "fecha_inicio": expediente.fecha_inicio.isoformat() if expediente.fecha_inicio else None,
            "archivos": [
                {
                    "id": archivo.id,
                    "nombre": archivo.nombre,
                    "ruta": archivo.ruta,
                    "fecha_subida": archivo.fecha_subida
                }
                for archivo in expediente.archivos
            ]
        })

    return expedientes


@router.put("/expediente/{expediente_id}/estado")
def cambiar_estado_expediente(expediente_id: int, estado_data: EstadoUpdate, db: Session = Depends(get_db)):
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    expediente.estado = estado_data.estado  # usar .estado del objeto Pydantic
    db.commit()
    db.refresh(expediente)
    return {"message": "Estado actualizado correctamente"}