from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.perfil import Perfil
from backend.models.usuarios import Usuario
from backend.services.oauth2 import get_current_user
from backend.services.auth_service import hash_password

router = APIRouter(prefix="/perfil", tags=["Perfil"])

# ------------------- GET /perfil/me -------------------
@router.get("/me")
def get_my_perfil(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == current_user.id).first()

    # Si no existe perfil, devolvemos campos por defecto
    return {
        "id": perfil.id if perfil else None,
        "id_usuario": current_user.id,
        "nombre": current_user.nombre,
        "nombre_usuario": current_user.nombre,
        "correo": current_user.correo,
        "descripcion": perfil.descripcion if perfil else "",
        "ubicacion": perfil.ubicacion if perfil else "",
        "telefono": perfil.telefono if perfil else "",
        "foto_perfil": perfil.foto_perfil if perfil and perfil.foto_perfil else "/img/cat_profile.jpg"
    }

# ------------------- GET /perfil/usuario/{id} -------------------
@router.get("/usuario/{id}")
def get_perfil_by_user_id(id: int, db: Session = Depends(get_db)):
    perfil = db.query(Perfil).filter(Perfil.id_usuario == id).first()
    usuario = db.query(Usuario).filter(Usuario.id == id).first()

    if not perfil or not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    # Obtener habilidades asociadas
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
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "telefono": perfil.telefono,
        "foto_perfil": perfil.foto_perfil or "/img/cat_profile.jpg",
        "habilidades": habilidades
    }

# ------------------- GET /perfil/{id} -------------------
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
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "descripcion": perfil.descripcion or "",
        "ubicacion": perfil.ubicacion or "",
        "telefono": perfil.telefono,
        "foto_perfil": perfil.foto_perfil or "/img/cat_profile.jpg",
        "nombre_usuario": usuario.nombre  # opcional para frontend
    }

# ------------------- PUT /perfil/{id} -------------------
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

    # Actualizar nombre
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

    # Actualizar teléfono
    if "telefono" in data:
        perfil.telefono = data["telefono"]

    # Actualizar contraseña
    if "contrasena" in data:
        contrasena = data["contrasena"]
        if len(contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_hash = hash_password(contrasena)

    # Guardar cambios
    try:
        db.commit()
        db.refresh(perfil)
        db.refresh(usuario)
        return {"msg": "Perfil actualizado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos")
