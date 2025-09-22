# publicaciones_admin_controller.py
print("✅ Router de publicaciones_admin_controller cargado")

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models import Publicacion
from backend.models.usuarios import Usuario
from backend.models.perfil import Perfil
from backend.schemas.publicacion_admin_schema import (
    PublicacionCreate,
    PublicacionUpdate,
    PublicacionOut,
    UsuarioOut,
    PerfilOut
)
from typing import List
import enum

router = APIRouter(prefix="/admin/publicaciones", tags=["Publicaciones Admin"])

# ===== RUTAS AUXILIARES =====

# GET - Listar todos los usuarios (para selects en frontend)
@router.get("/usuarios", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

# GET - Listar todos los perfiles (para selects en frontend)
@router.get("/perfiles", response_model=List[PerfilOut])
def listar_perfiles(db: Session = Depends(get_db)):
    return db.query(Perfil).all()

# ===== RUTAS PRINCIPALES =====

# GET - Listar todas las publicaciones (con relaciones)
@router.get("/", response_model=List[PublicacionOut])
def listar_publicaciones(db: Session = Depends(get_db)):
    publicaciones = db.query(Publicacion).order_by(Publicacion.fecha_creacion.desc()).all()
    return publicaciones

# GET - Obtener una publicación por ID
@router.get("/{publicacion_id}", response_model=PublicacionOut)
def obtener_publicacion(publicacion_id: int, db: Session = Depends(get_db)):
    publicacion = db.query(Publicacion).filter_by(id=publicacion_id).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    return publicacion

# POST - Crear nueva publicación
@router.post("/", response_model=PublicacionOut)
def crear_publicacion(data: PublicacionCreate, db: Session = Depends(get_db)):
    # Validar usuario
    usuario = db.query(Usuario).filter_by(id=data.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=400, detail=f"Usuario con ID {data.id_usuario} no existe")

    # Validar perfil si se proporciona
    if data.id_perfil:
        perfil = db.query(Perfil).filter_by(id=data.id_perfil).first()
        if not perfil:
            raise HTTPException(status_code=400, detail=f"Perfil con ID {data.id_perfil} no existe")

    # Crear publicación
    nueva = Publicacion(**data.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# PUT - Actualizar publicación
@router.put("/{publicacion_id}", response_model=PublicacionOut)
def actualizar_publicacion(publicacion_id: int, data: PublicacionUpdate, db: Session = Depends(get_db)):
    publicacion = db.query(Publicacion).filter_by(id=publicacion_id).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    update_data = data.dict(exclude_unset=True)

    # Validar nuevo usuario si se está actualizando
    if 'id_usuario' in update_data:
        usuario = db.query(Usuario).filter_by(id=update_data['id_usuario']).first()
        if not usuario:
            raise HTTPException(status_code=400, detail=f"Usuario con ID {update_data['id_usuario']} no existe")

    # Validar nuevo perfil si se está actualizando
    if 'id_perfil' in update_data:
        perfil = db.query(Perfil).filter_by(id=update_data['id_perfil']).first()
        if not perfil:
            raise HTTPException(status_code=400, detail=f"Perfil con ID {update_data['id_perfil']} no existe")

    # Aplicar actualizaciones
    for key, value in update_data.items():
        setattr(publicacion, key, value)

    db.commit()
    db.refresh(publicacion)
    return publicacion

# DELETE - Eliminar publicación (con comentarios en cascada)
@router.delete("/{publicacion_id}")
def eliminar_publicacion(publicacion_id: int, db: Session = Depends(get_db)):
    publicacion = db.query(Publicacion).filter_by(id=publicacion_id).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    db.delete(publicacion)
    db.commit()
    return {"ok": True, "message": "Publicación eliminada correctamente"}

