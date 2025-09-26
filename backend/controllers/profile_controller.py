# backend/controllers/perfil.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.perfil import Perfil
from backend.models.usuarios import Usuario
from backend.services.oauth2 import get_current_user
from backend.services.auth_service import hash_password

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

    from backend.models.perfil_habilidad import perfilHabilidad
    from backend.models.habilidad import Habilidad

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
    data: dict = Body(...),  # ✅ CORREGIDO: faltaba "data: "
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    usuario = db.query(Usuario).filter(Usuario.id == id).first()

    if not perfil or not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    # Actualizar nombre del USUARIO (si se envía)
    if "nombre" in data and data["nombre"] is not None:
        nuevo_nombre = str(data["nombre"]).strip()
        if not nuevo_nombre:
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        usuario.nombre = nuevo_nombre

    # Actualizar campos del PERFIL
    if "descripcion" in data:
        perfil.descripcion = data["descripcion"] if data["descripcion"] is not None else ""

    if "ubicacion" in data:
        perfil.ubicacion = data["ubicacion"] if data["ubicacion"] is not None else ""

    if "Tel" in data:
        tel_value = data["Tel"]
        if tel_value is None:
            perfil.Tel = None
        elif isinstance(tel_value, int) and tel_value >= 0:
            perfil.Tel = tel_value
        else:
            raise HTTPException(status_code=400, detail="Tel debe ser un entero no negativo o null")

    if "foto_perfil" in data:
        perfil.foto_perfil = data["foto_perfil"] if data["foto_perfil"] is not None else "/img/user.png"

    # Opcional: actualizar contraseña
    if "contrasena" in data:
        contrasena = data["contrasena"]
        if not isinstance(contrasena, str) or len(contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_hash = hash_password(contrasena)

    try:
        db.commit()
        db.refresh(perfil)
        db.refresh(usuario)
        return {"msg": "Perfil actualizado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos")