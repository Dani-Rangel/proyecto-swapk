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
        "nombre": perfil.usuario.nombre,   # corregido
        "correo": perfil.usuario.correo,   # corregido
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
        "nombre": perfil.usuario.nombre,   # corregido
        "correo": perfil.usuario.correo,   # corregido
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
        "nombre": perfil.usuario.nombre,  # corregido
        "descripcion": perfil.descripcion,
        "ubicacion": perfil.ubicacion,
        "foto_perfil": perfil.foto_perfil,
        "correo": usuario.correo,
        "nombre_usuario": usuario.nombre
    }

@router.put("/{id}")
def update_perfil(
    id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    usuario = db.query(Usuario).filter(Usuario.id == id).first()

    if not perfil or not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    # Actualizar nombre (solo en usuario, no en perfil porque no existe en modelo perfil)
    if "nombre" in data:
        nuevo_nombre = data["nombre"].strip()
        if not nuevo_nombre:
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        usuario.nombre = nuevo_nombre

    # Actualizar descripción
    if "descripcion" in data:
        perfil.descripcion = data["descripcion"]

    # Actualizar ubicación
    if "ubicacion" in data:
        perfil.ubicacion = data["ubicacion"]

    # Actualizar Teléfono
    if "Tel" in data:
        perfil.Tel = data["Tel"]

    # Actualizar foto de perfil
    if "foto_perfil" in data:
        perfil.foto_perfil = data["foto_perfil"]

    # Actualizar contraseña
    if "contrasena" in data:
        contrasena = data["contrasena"]
        if len(contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_hash = hash_password(contrasena)

    try:
        db.commit()
        db.refresh(perfil)
        db.refresh(usuario)
        return {"msg": "Perfil actualizado correctamente"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos")