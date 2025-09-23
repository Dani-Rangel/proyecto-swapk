from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.schemas.notificacion_schema import NotificacionCreate, NotificacionOut
from backend.services import notificacion_service as service
from backend.db.database import get_db  
from typing import List
from backend.models.usuarios import Usuario

router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)

@router.post("/", response_model=NotificacionOut)
def crear_notificacion(notificacion: NotificacionCreate, db: Session = Depends(get_db)):
    nueva = service.crear_notificacion(db, notificacion)
    usuario = db.query(Usuario).filter(Usuario.id == nueva.id_usuario).first()
    return {
        "id": nueva.id,
        "id_usuario": nueva.id_usuario,
        "contenido": nueva.contenido,
        "tipo": nueva.tipo,
        "fecha": nueva.fecha,
        "leido": nueva.leido,
        "nombre_usuario": usuario.nombre if usuario else "Desconocido"
    }

@router.get("/{user_id}", response_model=List[NotificacionOut])
def listar_notificaciones(user_id: int, db: Session = Depends(get_db)):
    notificaciones = service.obtener_notificaciones(db, user_id)
    return notificaciones  # Aquí devolvemos directamente la lista que ya incluye nombre_usuario

@router.put("/{notificacion_id}/leido", response_model=NotificacionOut)
def marcar_como_leido(notificacion_id: int, db: Session = Depends(get_db)):
    notificacion = service.marcar_leido(db, notificacion_id)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    usuario = db.query(Usuario).filter(Usuario.id == notificacion.id_usuario).first()
    return {
        "id": notificacion.id,
        "id_usuario": notificacion.id_usuario,
        "contenido": notificacion.contenido,
        "tipo": notificacion.tipo,
        "fecha": notificacion.fecha,
        "leido": notificacion.leido,
        "nombre_usuario": usuario.nombre if usuario else "Desconocido"
    }

@router.delete("/{notificacion_id}", status_code=204)
def eliminar_notificacion(notificacion_id: int, db: Session = Depends(get_db)):
    notificacion = service.eliminar_notificacion(db, notificacion_id)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return