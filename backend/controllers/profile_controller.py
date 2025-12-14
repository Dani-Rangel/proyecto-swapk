# backend/controllers/perfil.py

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from db.database import get_db
from models.perfil import Perfil
from models.usuarios import Usuario
from services.oauth2 import get_current_user
from services.auth_service import hash_password

# 👇 Instala con: pip install Pillow
from PIL import Image as PILImage
from math import ceil

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/perfil", tags=["Perfil"])

@router.get("/me")
def get_my_perfil(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == current_user.id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {
        "id": perfil.id,
        "id_usuario": perfil.id_usuario,
        "nombre": perfil.usuario.nombre,
        "correo": perfil.usuario.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "Tel": perfil.Tel,
        "foto_perfil": perfil.foto_perfil or "/img/user.png"
    }

@router.get("/usuario/{id}")
def get_perfil_by_user_id(id: int, db: Session = Depends(get_db)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    from models.perfil_habilidad import perfilHabilidad
    from models.habilidad import Habilidad

    habilidades_query = (
        db.query(perfilHabilidad, Habilidad.nombre)
        .join(Habilidad, perfilHabilidad.habilidad_id == Habilidad.id)
        .filter(perfilHabilidad.Perfil_id == perfil.id)
        .all()
    )

    habilidades = [
        {
            "id": ph.id,
            "habilidad_id": ph.habilidad_id,
            "tipo": ph.tipo.value,
            "nivel": ph.nivel.value,
            "habilidad_nombre": nombre
        }
        for ph, nombre in habilidades_query
    ]

    return {
        "id": perfil.id,
        "id_usuario": perfil.id_usuario,
        "nombre": perfil.usuario.nombre,
        "correo": perfil.usuario.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "Tel": perfil.Tel,
        "foto_perfil": perfil.foto_perfil or "/img/user.png",
        "habilidades": habilidades
    }

@router.get("/{id}")
def get_perfil(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    usuario = db.query(Usuario).filter(Usuario.id == id).first()

    if not perfil or not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return {
        "id": perfil.id,
        "id_usuario": perfil.id_usuario,
        "nombre": perfil.usuario.nombre,
        "descripcion": perfil.descripcion,
        "ubicacion": perfil.ubicacion,
        "foto_perfil": perfil.foto_perfil,
        "correo": usuario.correo,
        "nombre_usuario": usuario.nombre
    }

@router.put("/{id}")
def update_perfil(
    id: int,
    nombre: str = Form(None),
    descripcion: str = Form(None),
    ubicacion: str = Form(None),
    Tel: str = Form(None),
    foto_perfil: UploadFile = File(None),
    contrasena: str = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    usuario = db.query(Usuario).filter(Usuario.id == id).first()

    if not perfil or not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    if nombre is not None:
        nombre = nombre.strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        usuario.nombre = nombre

    if descripcion is not None:
        perfil.descripcion = descripcion if descripcion != "null" else ""

    if ubicacion is not None:
        perfil.ubicacion = ubicacion if ubicacion != "null" else ""

    if Tel is not None:
        if Tel == "null" or Tel == "":
            perfil.Tel = None
        else:
            try:
                tel_int = int(Tel)
                if tel_int < 0:
                    raise ValueError
                perfil.Tel = tel_int
            except ValueError:
                raise HTTPException(status_code=400, detail="Tel debe ser un entero no negativo o null")

    if foto_perfil is not None:
        if not foto_perfil.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes")

        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)

        try:
            img = PILImage.open(foto_perfil.file)
            img = img.convert("RGB")
            img.save(filepath, "JPEG", quality=85)
            perfil.foto_perfil = f"/{filepath.replace(os.sep, '/')}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")

    if contrasena is not None:
        if len(contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_hash = hash_password(contrasena)

    try:
        db.commit()
        db.refresh(perfil)
        db.refresh(usuario)
        return {
            "msg": "Perfil actualizado correctamente",
            "foto_perfil": perfil.foto_perfil
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos")

# Ruta pública existente (sin cambios)
@router.get("/todos-publicos", include_in_schema=False)
def get_todos_perfiles_publicos(db: Session = Depends(get_db)):
    try:
        perfiles = db.query(Perfil).join(Usuario).all()
        resultado = []
        for p in perfiles:
            resultado.append({
                "id": p.id,
                "id_usuario": p.id_usuario,
                "nombre": p.usuario.nombre,
                "descripcion": p.descripcion or "",
                "ubicacion": p.ubicacion or "",
                "Tel": p.Tel,
                "foto_perfil": p.foto_perfil or "/img/user.png"
            })
        return resultado
    except Exception as e:
        print("❌ Error en /perfil/todos-publicos:", str(e))
        raise HTTPException(status_code=500, detail="Error interno al cargar perfiles")