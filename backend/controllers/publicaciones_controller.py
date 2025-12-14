from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models import Usuario, Publicacion, Comentario, Like
from services.oauth2 import get_current_user
from schemas.publicaciones_schema import ComentarioCreate, PublicacionCreate, ComentarioUpdate

router = APIRouter(prefix="/api/publicaciones", tags=["Publicaciones"])

# --- Crear ---
@router.post("/")
def crear_publicacion(
    pub_data: PublicacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    nueva_publicacion = Publicacion(
        titulo=pub_data.titulo,
        contenido=pub_data.contenido,
        tipo=pub_data.tipo,
        imagen=pub_data.imagen,  # <-- Asegúrate de incluirlo
        id_usuario=current_user.id,
        id_perfil=current_user.perfil.id if current_user.perfil else None
    )

    db.add(nueva_publicacion)
    db.commit()
    db.refresh(nueva_publicacion)

    return {
        "id": nueva_publicacion.id,
        "titulo": nueva_publicacion.titulo,
        "contenido": nueva_publicacion.contenido,
        "tipo": nueva_publicacion.tipo,
        "imagen": nueva_publicacion.imagen,
        "fecha_creacion": nueva_publicacion.fecha_creacion.isoformat(),
        "usuario": {
            "nombre": current_user.nombre,
            "foto_perfil": current_user.perfil.foto_perfil if current_user.perfil else "/img/default.png"
        },
        "likes": [],
        "comentarios": []
    }

# --- Leer (Lista) ---
@router.get("/{tipo}")
def get_publicaciones_por_tipo(
    tipo: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    tipo_map = {
        "intercambios": "Intercambio",
        "cursos": "Curso",
        "preguntas": "Pregunta",
        "logros": "Logro"
    }

    query = db.query(
        Publicacion,
        func.count(Like.id).label('total_likes')
    ).outerjoin(Like, Publicacion.id == Like.id_publicacion)

    if tipo.lower() not in ["todo", "all"]:
        tipo_filtrado = tipo_map.get(tipo.lower())
        if not tipo_filtrado:
            raise HTTPException(status_code=400, detail="Tipo de publicación no válido")
        query = query.filter(Publicacion.tipo == tipo_filtrado)

    query = query.group_by(Publicacion.id).offset(skip).limit(limit)
    results = query.all()

    resultado = []
    for p, total_likes in results:
        resultado.append({
            "id": p.id,
            "titulo": p.titulo,
            "contenido": p.contenido,
            "tipo": p.tipo,
            "imagen": p.imagen,
            "fecha_creacion": p.fecha_creacion.isoformat(),
            "id_usuario": p.id_usuario,  # ✅ agregado
            "usuario": {
                "id": p.usuario.id,
                "nombre": p.usuario.nombre,
                "foto_perfil": p.usuario.perfil.foto_perfil if p.usuario.perfil else "/img/default.png"
            },
            "total_likes": total_likes,
            "comentarios": []
        })

    return resultado

# --- Leer (Comentarios) ---
@router.get("/{id_publicacion}/comentarios")
def get_comentarios(
    id_publicacion: int,
    db: Session = Depends(get_db)
):
    comentarios = db.query(Comentario).filter(
        Comentario.id_publicacion == id_publicacion,
        Comentario.id_comentario_padre == None
    ).all()

    resultado = []
    for c in comentarios:
        resultado.append({
            "id": c.id,
            "contenido": c.contenido,
            "id_usuario": c.id_usuario,  # ✅ agregado
            "nombre_usuario": c.usuario.nombre,
            "foto_perfil": c.usuario.perfil.foto_perfil if c.usuario.perfil else "/img/default.png",
            "fecha": c.fecha_creacion.isoformat(),
            "respuestas": [
                {
                    "id": r.id,
                    "contenido": r.contenido,
                    "id_usuario": r.id_usuario,  # ✅ agregado también
                    "nombre_usuario": r.usuario.nombre,
                    "foto_perfil": r.usuario.perfil.foto_perfil if r.usuario.perfil else "/img/default.png",
                    "fecha": r.fecha_creacion.isoformat(),
                }
                for r in c.respuestas
            ]
        })
    return resultado

# --- Crear Comentario ---
@router.post("/comentarios")
def crear_comentario(
    comentario_data: ComentarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    publicacion = db.query(Publicacion).filter(Publicacion.id == comentario_data.id_publicacion).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    if comentario_data.id_comentario_padre:
        comentario_padre = db.query(Comentario).filter(
            Comentario.id == comentario_data.id_comentario_padre,
            Comentario.id_publicacion == comentario_data.id_publicacion
        ).first()
        if not comentario_padre:
            raise HTTPException(status_code=404, detail="Comentario padre no encontrado")

    nuevo_comentario = Comentario(
        contenido=comentario_data.contenido,
        id_usuario=current_user.id,
        id_publicacion=comentario_data.id_publicacion,
        id_comentario_padre=comentario_data.id_comentario_padre
    )

    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)

    return {
        "id": nuevo_comentario.id,
        "contenido": nuevo_comentario.contenido,
        "nombre_usuario": current_user.nombre,
        "foto_perfil": current_user.perfil.foto_perfil if current_user.perfil else "/img/default.png",
        "fecha": nuevo_comentario.fecha_creacion.isoformat(),
        "respuestas": []
    }

# --- Toggle Like ---
@router.post("/{id_publicacion}/like")
def toggle_like(
    id_publicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    publicacion = db.query(Publicacion).filter(Publicacion.id == id_publicacion).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    like_existente = db.query(Like).filter(
        Like.id_usuario == current_user.id,
        Like.id_publicacion == id_publicacion
    ).first()

    liked = False
    if like_existente:
        db.delete(like_existente)
    else:
        nuevo_like = Like(id_usuario=current_user.id, id_publicacion=id_publicacion)
        db.add(nuevo_like)
        liked = True

    db.commit()
    total_likes = db.query(func.count(Like.id)).filter(Like.id_publicacion == id_publicacion).scalar()

    return {"liked": liked, "total_likes": total_likes}

# --- Listar Quién Dio Like (Solo para el autor de la publicación) ---
@router.get("/{id_publicacion}/likes")
def get_likes_de_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Primero, obtener la publicación para verificar autoría
    publicacion = db.query(Publicacion).filter(Publicacion.id == id_publicacion).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Verificar que el usuario actual sea el autor de la publicación
    if publicacion.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado para ver los likes de esta publicación")

    # Obtener todos los likes para esta publicación, junto con los datos del usuario que dio like
    likes = db.query(Like).filter(Like.id_publicacion == id_publicacion).all()

    resultado = []
    for like in likes:
        # Asumiendo que la relación `usuario` en el modelo `Like` está correctamente configurada
        # para cargar el objeto `Usuario` relacionado.
        usuario = like.usuario
        resultado.append({
            "id": like.id, # ID del like, útil si quisieras hacer algo con él
            "id_usuario": usuario.id,
            "nombre": usuario.nombre,
            "foto_perfil": usuario.perfil.foto_perfil if usuario.perfil else "/img/default.png",
            "fecha_creacion": like.fecha_creacion.isoformat()
        })

    return resultado    

# --- Editar Publicación ---
@router.put("/{id_publicacion}")
def editar_publicacion(
    id_publicacion: int,
    pub_data: PublicacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    publicacion = db.query(Publicacion).filter(Publicacion.id == id_publicacion).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if publicacion.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    for key, value in pub_data.dict().items():
        setattr(publicacion, key, value)

    db.commit()
    db.refresh(publicacion)

    return {
        "id": publicacion.id,
        "titulo": publicacion.titulo,
        "contenido": publicacion.contenido,
        "tipo": publicacion.tipo,
        "imagen": publicacion.imagen,
        "fecha_creacion": publicacion.fecha_creacion.isoformat(),
        "usuario": {
            "nombre": current_user.nombre,
            "foto_perfil": current_user.perfil.foto_perfil if current_user.perfil else "/img/default.png"
        },
        "likes": [{"id": like.id, "id_usuario": like.id_usuario} for like in publicacion.likes],
        "comentarios": []
    }

# --- Eliminar Publicación ---
@router.delete("/{id_publicacion}")
def eliminar_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    publicacion = db.query(Publicacion).filter(Publicacion.id == id_publicacion).first()
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if publicacion.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # NUEVO: Eliminar primero todos los likes asociados a esta publicación
    db.query(Like).filter(Like.id_publicacion == id_publicacion).delete()

    # Luego eliminar la publicación
    db.delete(publicacion)
    db.commit()
    return {"message": "Publicación eliminada"}

# --- Eliminar Comentario ---
@router.delete("/comentarios/{id_comentario}")
def eliminar_comentario(
    id_comentario: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    comentario = db.query(Comentario).filter(Comentario.id == id_comentario).first()
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if comentario.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    db.delete(comentario)
    db.commit()
    return {"message": "Comentario eliminado"}

# --- Editar Comentario ---
@router.put("/comentarios/{id_comentario}")
def editar_comentario(
    id_comentario: int,
    comentario_data: ComentarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    comentario = db.query(Comentario).filter(Comentario.id == id_comentario).first()
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    if comentario.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    comentario.contenido = comentario_data.contenido
    db.commit()
    db.refresh(comentario)

    return {
        "id": comentario.id,
        "contenido": comentario.contenido,
        "nombre_usuario": current_user.nombre,
        "foto_perfil": current_user.perfil.foto_perfil if current_user.perfil else "/img/default.png",
        "fecha": comentario.fecha_creacion.isoformat()
    }
