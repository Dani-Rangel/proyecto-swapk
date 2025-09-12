import os
from uuid import uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile
from backend.models import Expediente, Archivo_Expediente
from backend.schemas.expediente_schema import ExpedienteCreate, ExpedienteUpdate
from sqlalchemy.orm import joinedload

UPLOAD_DIR = "uploads"

def crear_expediente(db: Session, expediente_data: ExpedienteCreate):
    nuevo_expediente = Expediente(
        usuario_id=expediente_data.usuario_id,
        nombre=expediente_data.nombre,
        institucion=expediente_data.institucion,
        descripcion=expediente_data.descripcion,
        tipo=expediente_data.tipo,
        estado=expediente_data.estado,
        url_expediente=expediente_data.url_expediente,
        fecha_inicio=expediente_data.fecha_inicio,
        fecha_fin=expediente_data.fecha_fin,
    )
    db.add(nuevo_expediente)
    db.commit()
    db.refresh(nuevo_expediente)

    if expediente_data.archivos:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        for archivo in expediente_data.archivos:
            extension = archivo.nombre.split(".")[-1]
            unique_filename = f"{uuid4().hex}.{extension}"
            filepath = os.path.join(UPLOAD_DIR, unique_filename)

            with open(filepath, "wb") as f:
                f.write(b"")

            nuevo_archivo = Archivo_Expediente(
                expediente_id=nuevo_expediente.id,
                nombre=archivo.nombre,
                ruta=unique_filename,  # <-- CAMBIO aquí, guardar solo nombre archivo
                fecha_subida=archivo.fecha_subida or datetime.now()
            )
            db.add(nuevo_archivo)
        db.commit()

    return nuevo_expediente


def obtener_expediente_por_usuario(db: Session, usuario_id: int):
    return (
        db.query(Expediente)
        .options(joinedload(Expediente.archivos))  
        .filter(Expediente.usuario_id == usuario_id)
        .all()
    )


def obtener_expediente(db: Session, expediente_id: int):
    return db.query(Expediente).filter(Expediente.id == expediente_id).first()


def actualizar_expediente(db: Session, expediente_id: int, expediente_data: ExpedienteUpdate):
    expediente = obtener_expediente(db, expediente_id)
    if not expediente:
        return None

    for key, value in expediente_data.dict(exclude_unset=True).items():
        setattr(expediente, key, value)

    db.commit()
    db.refresh(expediente)
    return expediente


def eliminar_expediente(db: Session, expediente_id: int):
    expediente = obtener_expediente(db, expediente_id)
    if not expediente:
        return False

    # Eliminar archivos físicos asociados
    for archivo in expediente.archivos:
        if archivo.ruta and os.path.isfile(archivo.ruta):
            os.remove(archivo.ruta)
        db.delete(archivo)

    db.delete(expediente)
    db.commit()
    return True


def guardar_archivo_expediente(db: Session, expediente_id: int, file: UploadFile):
    expediente = obtener_expediente(db, expediente_id)
    if not expediente:
        return None

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid4().hex}.{extension}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)

    nuevo_archivo = Archivo_Expediente(
        expediente_id=expediente_id,
        nombre=file.filename,
        ruta=unique_filename,  # <-- CAMBIO aquí, guardar solo nombre archivo
        fecha_subida=datetime.now()
    )
    db.add(nuevo_archivo)
    db.commit()
    db.refresh(nuevo_archivo)
    return nuevo_archivo