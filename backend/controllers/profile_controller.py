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
from sqlalchemy.orm import joinedload
# Modelos necesarios para intercambios
from models.intercambio import Intercambio
from models.Propuesta_Intercambio import PropuestaIntercambio
from models.resena import Resena
from models.Intercambio_Habilidad import IntercambioHabilidad  # ← Asegúrate de que exista

# Esquemas Pydantic (usamos los que ya tienes)
from schemas.intercambio_schema import (
    IntercambioConHabilidadesSeparadas,
    ResenaResponse,
    PropuestaAceptada,
    HabilidadBase,
    UsuarioBase,
    TipoHabilidadEnum
)

# 👇 Instala con: pip install Pillow
from PIL import Image as PILImage

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

@router.get("/intercambios/{usuario_id}", response_model=list[IntercambioConHabilidadesSeparadas])
def get_intercambios_by_usuario_id(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene los intercambios donde el usuario participó (como creador o proponente aceptado),
    incluyendo reseñas. Público (no requiere autenticación).
    """
    # IDs de intercambios donde el usuario participó
    ids_creados = db.query(Intercambio.id).filter(Intercambio.id_usuario1 == usuario_id)
    ids_propuestos = db.query(PropuestaIntercambio.id_intercambio).filter(
        PropuestaIntercambio.id_usuario_interesado == usuario_id,
        PropuestaIntercambio.aceptada == True
    )
    todos_ids = {row[0] for row in ids_creados.union(ids_propuestos).all()}
    
    if not todos_ids:
        return []

    # ✅ Cargar con todas las relaciones necesarias
    intercambios = db.query(Intercambio).options(
        joinedload(Intercambio.usuario1),
        joinedload(Intercambio.perfil),
        joinedload(Intercambio.habilidades).joinedload(IntercambioHabilidad.habilidad),
        joinedload(Intercambio.propuestas).joinedload(PropuestaIntercambio.usuario_interesado),
        joinedload(Intercambio.reseñas).joinedload(Resena.autor),
        joinedload(Intercambio.reseñas).joinedload(Resena.destinatario),
    ).filter(Intercambio.id.in_(todos_ids)).all()

    resultado = []
    for inter in intercambios:
        # Separar habilidades por tipo
        habilidades_ofrece = [
            h.habilidad for h in inter.habilidades if h.tipo == TipoHabilidadEnum.ofrece
        ]
        habilidades_busca = [
            h.habilidad for h in inter.habilidades if h.tipo == TipoHabilidadEnum.busca
        ]
        
        # Propuestas aceptadas
        propuestas_aceptadas = [p for p in inter.propuestas if p.aceptada]
        
        # ✅ RESEÑAS: construir manualmente para evitar errores
        reseñas_lista = []
        for r in inter.reseñas:
            if r.autor and r.destinatario:
                reseñas_lista.append(
                    ResenaResponse(
                        id=r.id,
                        autor=UsuarioBase(id=r.autor.id, nombre=r.autor.nombre),  # ← Usamos tu UsuarioBase
                        destinatario=UsuarioBase(id=r.destinatario.id, nombre=r.destinatario.nombre),
                        calificacion=r.calificacion,
                        comentario=r.comentario,
                        fecha=r.fecha
                    )
                )

        # ✅ Construir respuesta con tu esquema
        intercambio_respuesta = IntercambioConHabilidadesSeparadas(
            id=inter.id,
            id_usuario1=inter.id_usuario1,
            id_perfil=inter.id_perfil,
            nivel=inter.nivel,
            modo=inter.modo,
            disponibilidad=inter.disponibilidad,
            idioma=inter.idioma,
            descripcion=inter.descripcion,
            valoracion=inter.valoracion,
            estado=inter.estado,
            fecha_creacion=inter.fecha_creacion,
            usuario1=inter.usuario1,
            perfil=inter.perfil,
            habilidades_ofrece=[HabilidadBase(id=h.id, nombre=h.nombre) for h in habilidades_ofrece],
            habilidades_busca=[HabilidadBase(id=h.id, nombre=h.nombre) for h in habilidades_busca],
            propuestas=[
                PropuestaAceptada(
                    id=p.id,
                    id_usuario_interesado=p.id_usuario_interesado,
                    aceptada=p.aceptada,
                    usuario_interesado=p.usuario_interesado
                )
                for p in propuestas_aceptadas
            ],
            reseñas=reseñas_lista,  # ✅ Lista construida manualmente
            ya_participaste=True
        )
        resultado.append(intercambio_respuesta)

    return resultado

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

    # --- Actualizar nombre del usuario ---
    if nombre is not None:
        nombre = nombre.strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        usuario.nombre = nombre

    # --- Actualizar campos del perfil ---
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

    # --- Subir foto de perfil ---
    if foto_perfil is not None:
        # Validar tipo de archivo
        if not foto_perfil.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes")

        # Generar nombre único y forzar extensión .jpg
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)

        try:
            # Leer la imagen con PIL y guardar como JPG
            img = PILImage.open(foto_perfil.file)
            img = img.convert("RGB")  # Eliminar transparencia si existe
            img.save(filepath, "JPEG", quality=85)

            # Actualizar ruta en DB (ruta relativa desde frontend)
            perfil.foto_perfil = f"/{filepath.replace(os.sep, '/')}"  # Ej: "/uploads/abc123.jpg"

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")

    # --- Actualizar contraseña ---
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
            "foto_perfil": perfil.foto_perfil  # ✅ Devolvemos la ruta relativa
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos")
    
