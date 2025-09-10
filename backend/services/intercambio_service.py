from sqlalchemy.orm import Session 
from backend.models import Intercambio, IntercambioHabilidad
from backend.models.habilidad import Habilidad
from backend.schemas.intercambio_schema import IntercambioCreate
from typing import List

# -------------------------------
# Crear un intercambio con habilidades
# -------------------------------
def crear_intercambio(db: Session, intercambio: IntercambioCreate):
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
    if intercambio.habilidades_ofrecidas_ids:
        for hid in intercambio.habilidades_ofrecidas_ids:
            db.add(IntercambioHabilidad(
                intercambio_id=nuevo.id,
                habilidad_id=hid,
                tipo="ofrece"
            ))

    # Guardar habilidades buscadas
    if intercambio.habilidades_buscadas_ids:
        for hid in intercambio.habilidades_buscadas_ids:
            db.add(IntercambioHabilidad(
                intercambio_id=nuevo.id,
                habilidad_id=hid,
                tipo="busca"
            ))

    db.commit()
    db.refresh(nuevo)

    # Separar habilidades en ofrecidas y buscadas
    habilidades_ofrecidas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in nuevo.habilidades if ih.tipo == "ofrece"
    ]
    habilidades_buscadas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in nuevo.habilidades if ih.tipo == "busca"
    ]

    return {
        "id": nuevo.id,
        "id_usuario1": nuevo.id_usuario1,
        "id_perfil": nuevo.id_perfil,
        "nivel": nuevo.nivel,
        "modo": nuevo.modo,
        "disponibilidad": nuevo.disponibilidad,
        "idioma": nuevo.idioma,
        "descripcion": nuevo.descripcion,
        "valoracion": nuevo.valoracion,
        "estado_trueque": nuevo.estado_trueque,
        "estado": nuevo.estado,
        "fecha_creacion": nuevo.fecha_creacion,
        "usuario1": {
            "id": nuevo.usuario1.id,
            "nombre": nuevo.usuario1.nombre
        },
        "perfil": {
            "id": nuevo.perfil.id,
            "ubicacion": nuevo.perfil.ubicacion,
            "foto_perfil": nuevo.perfil.foto_perfil
        },
        "habilidades_ofrecidas": habilidades_ofrecidas,
        "habilidades_buscadas": habilidades_buscadas
    }



# -------------------------------
# Obtener todos los intercambios
# -------------------------------
def obtener_intercambios(db: Session):
    intercambios = db.query(Intercambio).all()
    result = []

    for intercambio in intercambios:
        usuario_data = {
            "id": intercambio.usuario1.id,
            "nombre": intercambio.usuario1.nombre
        }
        perfil_data = {
            "id": intercambio.perfil.id,
            "ubicacion": intercambio.perfil.ubicacion,
            "foto_perfil": intercambio.perfil.foto_perfil
        }

        habilidades_ofrecidas = [
            {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
            for ih in intercambio.habilidades if ih.tipo == "ofrece"
        ]
        habilidades_buscadas = [
            {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
            for ih in intercambio.habilidades if ih.tipo == "busca"
        ]

        result.append({
            "id": intercambio.id,
            "id_usuario1": intercambio.id_usuario1,
            "id_perfil": intercambio.id_perfil,
            "nivel": intercambio.nivel,
            "modo": intercambio.modo,
            "disponibilidad": intercambio.disponibilidad,
            "idioma": intercambio.idioma,
            "descripcion": intercambio.descripcion,
            "valoracion": intercambio.valoracion,
            "estado_trueque": intercambio.estado_trueque,
            "estado": intercambio.estado,
            "fecha_creacion": intercambio.fecha_creacion,
            "usuario1": usuario_data,
            "perfil": perfil_data,
            "habilidades_ofrecidas": habilidades_ofrecidas,
            "habilidades_buscadas": habilidades_buscadas
        })

    return result


# -------------------------------
# Obtener un intercambio por ID
# -------------------------------
def obtener_intercambio(db: Session, id: int):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        return None

    usuario_data = {
        "id": intercambio.usuario1.id,
        "nombre": intercambio.usuario1.nombre
    }
    perfil_data = {
        "id": intercambio.perfil.id,
        "ubicacion": intercambio.perfil.ubicacion,
        "foto_perfil": intercambio.perfil.foto_perfil
    }

    habilidades_ofrecidas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in intercambio.habilidades if ih.tipo == "ofrece"
    ]
    habilidades_buscadas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in intercambio.habilidades if ih.tipo == "busca"
    ]

    return {
        "id": intercambio.id,
        "id_usuario1": intercambio.id_usuario1,
        "id_perfil": intercambio.id_perfil,
        "nivel": intercambio.nivel,
        "modo": intercambio.modo,
        "disponibilidad": intercambio.disponibilidad,
        "idioma": intercambio.idioma,
        "descripcion": intercambio.descripcion,
        "valoracion": intercambio.valoracion,
        "estado_trueque": intercambio.estado_trueque,
        "estado": intercambio.estado,
        "fecha_creacion": intercambio.fecha_creacion,
        "usuario1": usuario_data,
        "perfil": perfil_data,
        "habilidades_ofrecidas": habilidades_ofrecidas,
        "habilidades_buscadas": habilidades_buscadas
    }

# -------------------------------
# Actualizar intercambio con habilidades
# -------------------------------
def actualizar_intercambio(db: Session, id: int, intercambio: IntercambioCreate):
    existente = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not existente:
        return None

    # Actualizar campos principales
    existente.nivel = intercambio.nivel
    existente.modo = intercambio.modo
    existente.idioma = intercambio.idioma
    existente.descripcion = intercambio.descripcion
    existente.disponibilidad = intercambio.disponibilidad
    existente.valoracion = intercambio.valoracion
    existente.estado_trueque = intercambio.estado_trueque
    existente.estado = intercambio.estado

    # Borrar habilidades actuales
    db.query(IntercambioHabilidad).filter(
        IntercambioHabilidad.intercambio_id == existente.id
    ).delete()

    # Insertar nuevas habilidades ofrecidas
    if intercambio.habilidades_ofrecidas_ids:
        for hid in intercambio.habilidades_ofrecidas_ids:
            db.add(IntercambioHabilidad(
                intercambio_id=existente.id,
                habilidad_id=hid,
                tipo="ofrece"
            ))

    # Insertar nuevas habilidades buscadas
    if intercambio.habilidades_buscadas_ids:
        for hid in intercambio.habilidades_buscadas_ids:
            db.add(IntercambioHabilidad(
                intercambio_id=existente.id,
                habilidad_id=hid,
                tipo="busca"
            ))

    db.commit()
    db.refresh(existente)

    # Separar habilidades en ofrecidas y buscadas
    habilidades_ofrecidas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in existente.habilidades if ih.tipo == "ofrece"
    ]
    habilidades_buscadas = [
        {"id": ih.habilidad.id, "nombre": ih.habilidad.nombre}
        for ih in existente.habilidades if ih.tipo == "busca"
    ]

    return {
        "id": existente.id,
        "id_usuario1": existente.id_usuario1,
        "id_perfil": existente.id_perfil,
        "nivel": existente.nivel,
        "modo": existente.modo,
        "disponibilidad": existente.disponibilidad,
        "idioma": existente.idioma,
        "descripcion": existente.descripcion,
        "valoracion": existente.valoracion,
        "estado_trueque": existente.estado_trueque,
        "estado": existente.estado,
        "fecha_creacion": existente.fecha_creacion,
        "usuario1": {
            "id": existente.usuario1.id,
            "nombre": existente.usuario1.nombre
        },
        "perfil": {
            "id": existente.perfil.id,
            "ubicacion": existente.perfil.ubicacion,
            "foto_perfil": existente.perfil.foto_perfil
        },
        "habilidades_ofrecidas": habilidades_ofrecidas,
        "habilidades_buscadas": habilidades_buscadas
    }



# -------------------------------
# Eliminar intercambio
# -------------------------------
def eliminar_intercambio(db: Session, id: int):
    db_intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not db_intercambio:
        return False

    # Eliminar relaciones de habilidades
    db.query(IntercambioHabilidad).filter(IntercambioHabilidad.intercambio_id == id).delete()
    db.delete(db_intercambio)
    db.commit()
    return True
