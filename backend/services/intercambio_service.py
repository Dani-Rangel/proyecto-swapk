from sqlalchemy.orm import Session
from typing import List, Optional

from backend.models import Intercambio, IntercambioHabilidad, Habilidad
from backend.schemas.intercambio_schema import (
    IntercambioCreate,
    IntercambioConHabilidadesSeparadas,
    UsuarioBase,
    PerfilBase,
    HabilidadBase,
)


# -------------------------------
# Crear un intercambio con habilidades
# -------------------------------
def crear_intercambio(db: Session, intercambio: IntercambioCreate) -> IntercambioConHabilidadesSeparadas:
    nuevo = Intercambio(
        id_usuario1=intercambio.id_usuario1,
        id_perfil=intercambio.id_perfil,
        nivel=intercambio.nivel,
        modo=intercambio.modo,
        idioma=intercambio.idioma,
        descripcion=intercambio.descripcion,
        disponibilidad=intercambio.disponibilidad,
        valoracion=intercambio.valoracion,
        estado_trueque=intercambio.estado_trueque,
        estado=intercambio.estado
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    # Guardar habilidades ofrecidas
    for hid in intercambio.habilidades_ofrecidas_ids or []:
        db.add(IntercambioHabilidad(
            intercambio_id=nuevo.id,
            habilidad_id=hid,
            tipo="ofrece"
        ))

    # Guardar habilidades buscadas
    for hid in intercambio.habilidades_buscadas_ids or []:
        db.add(IntercambioHabilidad(
            intercambio_id=nuevo.id,
            habilidad_id=hid,
            tipo="busca"
        ))

    db.commit()
    return obtener_intercambio(db, nuevo.id)


# -------------------------------
# Obtener todos los intercambios
# -------------------------------
def obtener_intercambios(db: Session) -> List[IntercambioConHabilidadesSeparadas]:
    intercambios = db.query(Intercambio).all()
    return [obtener_intercambio(db, i.id) for i in intercambios if i]


# -------------------------------
# Obtener un intercambio por ID
# -------------------------------
def obtener_intercambio(db: Session, id: int) -> Optional[IntercambioConHabilidadesSeparadas]:
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        return None

    # Separar habilidades por tipo y convertirlas en HabilidadBase
    habilidades_ofrece = [
        HabilidadBase(
            id=ih.habilidad.id,
            nombre=ih.habilidad.nombre
        ) for ih in intercambio.habilidades if ih.tipo == "ofrece"
    ]

    habilidades_busca = [
        HabilidadBase(
            id=ih.habilidad.id,
            nombre=ih.habilidad.nombre
        ) for ih in intercambio.habilidades if ih.tipo == "busca"
    ]

    return IntercambioConHabilidadesSeparadas(
        id=intercambio.id,
        id_usuario1=intercambio.id_usuario1,
        id_perfil=intercambio.id_perfil,
        nivel=intercambio.nivel,
        modo=intercambio.modo,
        disponibilidad=intercambio.disponibilidad,
        idioma=intercambio.idioma,
        descripcion=intercambio.descripcion,
        valoracion=intercambio.valoracion,
        estado_trueque=intercambio.estado_trueque,
        estado=intercambio.estado,
        fecha_creacion=intercambio.fecha_creacion,
        usuario1=UsuarioBase(
            id=intercambio.usuario1.id,
            nombre=intercambio.usuario1.nombre
        ),
        perfil=PerfilBase(
            id=intercambio.perfil.id,
            ubicacion=intercambio.perfil.ubicacion,
            foto_perfil=intercambio.perfil.foto_perfil
        ),
        habilidades_ofrece=habilidades_ofrece,
        habilidades_busca=habilidades_busca
    )


# -------------------------------
# Actualizar un intercambio
# -------------------------------
def actualizar_intercambio(db: Session, id: int, intercambio: IntercambioCreate) -> Optional[IntercambioConHabilidadesSeparadas]:
    existente = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not existente:
        return None

    # Actualizar campos
    existente.nivel = intercambio.nivel
    existente.modo = intercambio.modo
    existente.idioma = intercambio.idioma
    existente.descripcion = intercambio.descripcion
    existente.disponibilidad = intercambio.disponibilidad
    existente.valoracion = intercambio.valoracion
    existente.estado_trueque = intercambio.estado_trueque
    existente.estado = intercambio.estado

    # Eliminar habilidades anteriores
    db.query(IntercambioHabilidad).filter(
        IntercambioHabilidad.intercambio_id == existente.id
    ).delete()

    # Insertar nuevas habilidades
    for hid in intercambio.habilidades_ofrecidas_ids or []:
        db.add(IntercambioHabilidad(
            intercambio_id=existente.id,
            habilidad_id=hid,
            tipo="ofrece"
        ))

    for hid in intercambio.habilidades_buscadas_ids or []:
        db.add(IntercambioHabilidad(
            intercambio_id=existente.id,
            habilidad_id=hid,
            tipo="busca"
        ))

    db.commit()
    return obtener_intercambio(db, existente.id)


# -------------------------------
# Eliminar un intercambio
# -------------------------------
def eliminar_intercambio(db: Session, id: int) -> bool:
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        return False

    db.query(IntercambioHabilidad).filter(
        IntercambioHabilidad.intercambio_id == id
    ).delete()

    db.delete(intercambio)
    db.commit()
    return True
