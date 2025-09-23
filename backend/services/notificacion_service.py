from sqlalchemy.orm import Session
from backend.models import Notificacion, Usuario
from backend.schemas.notificacion_schema import NotificacionCreate
from datetime import datetime

def crear_notificacion(db: Session, notificacion_data: NotificacionCreate):
    nueva = Notificacion(
        id_usuario=notificacion_data.id_usuario,
        contenido=notificacion_data.contenido,
        tipo=notificacion_data.tipo,
        fecha=notificacion_data.fecha or datetime.utcnow(),
        leido=notificacion_data.leido or False,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

def obtener_notificaciones(db: Session, user_id: int):
    notificaciones = (
        db.query(Notificacion, Usuario.nombre.label("nombre_usuario"))
        .join(Usuario, Usuario.id == Notificacion.id_usuario)
        .filter(Notificacion.id_usuario == user_id)
        .order_by(Notificacion.fecha.desc())
        .all()
    )

    resultado = []
    for n, nombre_usuario in notificaciones:
        n_dict = n.__dict__.copy()
        n_dict["nombre_usuario"] = nombre_usuario
        resultado.append(n_dict)

    return resultado

def marcar_leido(db: Session, notificacion_id: int):
    notificacion = db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()
    if notificacion:
        notificacion.leido = True
        db.commit()
        db.refresh(notificacion)
    return notificacion

def eliminar_notificacion(db: Session, notificacion_id: int):
    notificacion = db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()
    if not notificacion:
        return None
    db.delete(notificacion)
    db.commit()
    return notificacion