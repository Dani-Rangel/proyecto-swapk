from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from models.Propuesta_Intercambio import PropuestaIntercambio
from models import Intercambio, Usuario, Resena, Habilidad, IntercambioHabilidad
from db.database import get_db
from services.oauth2 import get_current_user
from services import intercambio_service
from schemas.intercambio_schema import (
    IntercambioCreate,
    IntercambioConHabilidadesSeparadas,
    EstadoIntercambioEnum,
    PropuestaResumen,
    ResenaCreate, 
    ResenaResponse,
    TipoHabilidadEnum,
    HabilidadBase,
    PropuestaAceptada,
    UsuarioBase
)
from typing import List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# -------------------------------
# Configuración de correo (FastMail)
# -------------------------------
mail_conf = ConnectionConfig(
    MAIL_USERNAME="swapk.soporte@gmail.com",
    MAIL_PASSWORD="pyaa ihkw byse cacr",  # App Password de Gmail
    MAIL_SERVER="smtp.gmail.com",
    MAIL_PORT=587,
    MAIL_FROM="swapk.soporte@gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

router = APIRouter(
    prefix="/intercambios",
    tags=["Intercambios"]
)

@router.get("/", response_model=List[IntercambioConHabilidadesSeparadas])
def listar_intercambios(db: Session = Depends(get_db)):
    return intercambio_service.obtener_intercambios(db)

@router.get("/mis-propuestas", response_model=List[PropuestaResumen])
def obtener_mis_propuestas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    propuestas = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id_usuario_interesado == current_user.id,
        PropuestaIntercambio.aceptada == False
    ).all()
    return [
        PropuestaResumen(
            id_intercambio=p.id_intercambio,
            id_propuesta=p.id,
            id_usuario_interesado=p.id_usuario_interesado,
            aceptada=p.aceptada
        )
        for p in propuestas
    ]

# -------------------------------
# ✅ NUEVO: Obtener intercambios finalizados con reseñas donde el usuario participó
# -------------------------------
@router.get("/resenas/por-usuario/{usuario_id}", response_model=List[IntercambioConHabilidadesSeparadas])
def obtener_intercambios_con_resenas_por_usuario(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    # Obtener IDs de intercambios donde el usuario participó
    ids_creados = db.query(Intercambio.id).filter(Intercambio.id_usuario1 == usuario_id)
    ids_propuestos = db.query(PropuestaIntercambio.id_intercambio).filter(
        PropuestaIntercambio.id_usuario_interesado == usuario_id,
        PropuestaIntercambio.aceptada == True
    )
    todos_ids = {row[0] for row in ids_creados.union(ids_propuestos).all()}
    
    if not todos_ids:
        return []

    # Cargar con todas las relaciones
    intercambios = db.query(Intercambio).options(
        joinedload(Intercambio.usuario1),
        joinedload(Intercambio.perfil),
        joinedload(Intercambio.habilidades).joinedload(IntercambioHabilidad.habilidad),
        joinedload(Intercambio.propuestas).joinedload(PropuestaIntercambio.usuario_interesado),
        # ✅ Cargar reseñas Y sus relaciones autor/destinatario
        joinedload(Intercambio.reseñas).joinedload(Resena.autor),
        joinedload(Intercambio.reseñas).joinedload(Resena.destinatario),
    ).filter(Intercambio.id.in_(todos_ids)).all()

    resultado = []
    for inter in intercambios:
        # Habilidades
        habilidades_ofrece = [h.habilidad for h in inter.habilidades if h.tipo == TipoHabilidadEnum.ofrece]
        habilidades_busca = [h.habilidad for h in inter.habilidades if h.tipo == TipoHabilidadEnum.busca]
        
        # Propuestas aceptadas
        propuestas_aceptadas = [p for p in inter.propuestas if p.aceptada]
        
        # ✅ RESEÑAS: Construcción segura manual
        reseñas_lista = []
        for r in inter.reseñas:
            if r.autor and r.destinatario:
                reseñas_lista.append(
                    ResenaResponse(
                        id=r.id,
                        autor=UsuarioBase(id=r.autor.id, nombre=r.autor.nombre),
                        destinatario=UsuarioBase(id=r.destinatario.id, nombre=r.destinatario.nombre),
                        calificacion=r.calificacion,
                        comentario=r.comentario,
                        fecha=r.fecha
                    )
                )

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
            estado_trueque=inter.estado_trueque,
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
            reseñas=reseñas_lista,  # ✅ Usar la lista construida manualmente
            ya_participaste=True
        )
        resultado.append(intercambio_respuesta)

    return resultado

@router.get("/{id}", response_model=IntercambioConHabilidadesSeparadas)
def obtener_intercambio(id: int, db: Session = Depends(get_db)):
    intercambio = intercambio_service.obtener_intercambio(db, id)
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return intercambio

@router.post("/", response_model=IntercambioConHabilidadesSeparadas)
def crear_intercambio(intercambio: IntercambioCreate, db: Session = Depends(get_db)):
    return intercambio_service.crear_intercambio(db, intercambio)

@router.put("/{id}", response_model=IntercambioConHabilidadesSeparadas)
def actualizar_intercambio(id: int, intercambio: IntercambioCreate, db: Session = Depends(get_db)):
    actualizado = intercambio_service.actualizar_intercambio(db, id, intercambio)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return actualizado

@router.delete("/{id}")
def eliminar_intercambio(id: int, db: Session = Depends(get_db)):
    eliminado = intercambio_service.eliminar_intercambio(db, id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return {"message": "Intercambio eliminado correctamente"}

# -------------------------------
# ✅ Endpoint para crear propuesta + enviar correo
# -------------------------------
@router.post("/{id}/propuesta")
async def crear_propuesta(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    
    if intercambio.estado != EstadoIntercambioEnum.Pendiente:
        raise HTTPException(status_code=400, detail="Este intercambio ya está confirmado o finalizado")
    
    if intercambio.id_usuario1 == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes proponerte a ti mismo")

    propuesta_existente = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id_intercambio == id,
        PropuestaIntercambio.id_usuario_interesado == current_user.id
    ).first()
    if propuesta_existente:
        raise HTTPException(status_code=400, detail="Ya has propuesto este intercambio")

    nueva_propuesta = PropuestaIntercambio(
        id_intercambio=id,
        id_usuario_interesado=current_user.id
    )
    db.add(nueva_propuesta)
    db.commit()

    # ✅ Enviar notificación por correo al creador del intercambio
    creador = db.query(Usuario).filter(Usuario.id == intercambio.id_usuario1).first()
    if creador and creador.correo:
        try:
            body = f"""
            <html>
                <body>
                    <h2>¡Nueva propuesta de intercambio!</h2>
                    <p>Hola <strong>{creador.nombre}</strong>,</p>
                    <p>El usuario <strong>{current_user.nombre}</strong> te ha enviado una propuesta para tu intercambio (ID: {id}).</p>
                    <p>Ingresa a tu plataforma para revisarla y aceptarla si estás interesado.</p>
                    <hr>
                    <p>Atentamente,<br><strong>Equipo de Swapk</strong></p>
                </body>
            </html>
            """
            message = MessageSchema(
                subject="Nueva propuesta de intercambio en Swapk",
                recipients=[creador.correo],
                body=body,
                subtype="html"
            )
            fm = FastMail(mail_conf)
            await fm.send_message(message)
        except Exception as e:
            # Opcional: loggear error, pero no interrumpir la propuesta
            print(f"⚠️ Error al enviar notificación por correo: {e}")

    return {"message": "Propuesta enviada"}

# -------------------------------
# Otros endpoints (sin cambios)
# -------------------------------
@router.get("/{id}/propuestas")
def obtener_propuestas(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    if intercambio.id_usuario1 != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el creador puede ver las propuestas")

    propuestas_pendientes = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id_intercambio == id,
        PropuestaIntercambio.aceptada == False
    ).all()

    return [
        {
            "id": p.id,
            "usuario_interesado": {"id": p.usuario_interesado.id, "nombre": p.usuario_interesado.nombre},
            "aceptada": p.aceptada,
            "fecha_propuesta": p.fecha_propuesta
        }
        for p in propuestas_pendientes
    ]

@router.post("/{id}/propuestas/{propuesta_id}/aceptar")
def aceptar_propuesta(id: int, propuesta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio or intercambio.id_usuario1 != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    propuesta_a_aceptar = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id == propuesta_id,
        PropuestaIntercambio.id_intercambio == id,
        PropuestaIntercambio.aceptada == False
    ).first()
    if not propuesta_a_aceptar:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada o ya aceptada")

    db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id_intercambio == id,
        PropuestaIntercambio.id != propuesta_id
    ).update({"aceptada": False})

    propuesta_a_aceptar.aceptada = True
    intercambio.estado = EstadoIntercambioEnum.Confirmado
    db.commit()

    return {
        "message": "Propuesta aceptada",
        "redirect": "/message/messages",
        "intercambio_id": intercambio.id,
        "usuario_interesado_id": propuesta_a_aceptar.id_usuario_interesado
    }

@router.delete("/{intercambio_id}/propuestas/{propuesta_id}")
def cancelar_propuesta(
    intercambio_id: int,
    propuesta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    propuesta = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id == propuesta_id,
        PropuestaIntercambio.id_intercambio == intercambio_id
    ).first()
    if not propuesta:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")

    intercambio = db.query(Intercambio).filter(Intercambio.id == intercambio_id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")

    es_creador = intercambio.id_usuario1 == current_user.id
    es_proponente = propuesta.id_usuario_interesado == current_user.id

    if not (es_creador or es_proponente):
        raise HTTPException(status_code=403, detail="No autorizado para cancelar esta propuesta")

    db.delete(propuesta)
    db.commit()
    return {"message": "Propuesta cancelada correctamente"}

@router.post("/{id}/restablecer")
def restablecer_intercambio(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    
    if intercambio.id_usuario1 != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el creador puede restablecer")

    intercambio.ciclo = (intercambio.ciclo or 0) + 1
    intercambio.estado = EstadoIntercambioEnum.Pendiente
    db.commit()  # ✅ Sin eliminar propuestas
    
    return {"message": "Intercambio restablecido"}

@router.post("/{id}/finalizar")
def finalizar_intercambio(
    id: int,
    resena: Optional[ResenaCreate] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")

    propuesta_aceptada = db.query(PropuestaIntercambio).filter(
        PropuestaIntercambio.id_intercambio == id,
        PropuestaIntercambio.aceptada == True
    ).first()

    if not propuesta_aceptada:
        raise HTTPException(status_code=400, detail="No hay propuesta aceptada")

    creador_id = intercambio.id_usuario1
    proponente_id = propuesta_aceptada.id_usuario_interesado

    if current_user.id not in (creador_id, proponente_id):
        raise HTTPException(status_code=403, detail="No autorizado")

    autor_id = current_user.id
    destinatario_id = proponente_id if current_user.id == creador_id else creador_id

    if resena:
        if not (1 <= resena.calificacion <= 5):
            raise HTTPException(status_code=400, detail="Calificación inválida")

        reseña_existente = db.query(Resena).filter(
            Resena.intercambio_id == id,
            Resena.autor_id == autor_id,
            Resena.ciclo == intercambio.ciclo
        ).first()

        if reseña_existente:
            raise HTTPException(status_code=400, detail="Reseña ya existente")

        nueva_resena = Resena(
            intercambio_id=id,
            autor_id=autor_id,
            destinatario_id=destinatario_id,
            calificacion=resena.calificacion,
            comentario=resena.comentario,
            ciclo=intercambio.ciclo
        )
        db.add(nueva_resena)

    # ✅ SOLO CAMBIA EL ESTADO, NO ELIMINES PROPUESTAS
    intercambio.estado = EstadoIntercambioEnum.Finalizado
    db.commit()
    db.refresh(intercambio)

    return {"message": "Intercambio finalizado con éxito"}

@router.get("/resenas/mias", response_model=List[ResenaResponse])
def obtener_mis_resenas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene las reseñas que otros usuarios me han dejado a MÍ (soy el destinatario).
    """
    reseñas = db.query(Resena).filter(Resena.destinatario_id == current_user.id).all()
    return reseñas

@router.get("/resenas/escritas", response_model=List[ResenaResponse])
def obtener_resenas_escritas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene las reseñas que YO he escrito (soy el autor).
    """
    reseñas = db.query(Resena).filter(Resena.autor_id == current_user.id).all()
    return reseñas        

# En tu archivo de rutas de intercambios
@router.get("/resenas/todas", response_model=List[ResenaResponse])
def obtener_todas_las_resenas(
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las reseñas públicas (sin necesidad de autenticación).
    """
    reseñas = db.query(Resena).order_by(Resena.fecha.desc()).all()
    return reseñas   

  
