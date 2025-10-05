from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.models.Propuesta_Intercambio import PropuestaIntercambio
from backend.models import Intercambio, Usuario
from backend.db.database import get_db
from backend.services.oauth2 import get_current_user
from backend.services import intercambio_service
from backend.schemas.intercambio_schema import (
    IntercambioCreate,
    IntercambioConHabilidadesSeparadas,
    EstadoIntercambioEnum,
    PropuestaResumen
)
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

@router.post("/{id}/finalizar")
def finalizar_intercambio(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    intercambio = db.query(Intercambio).filter(Intercambio.id == id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")

    if intercambio.id_usuario1 != current_user.id:
        propuesta = db.query(PropuestaIntercambio).filter(
            PropuestaIntercambio.id_intercambio == id,
            PropuestaIntercambio.id_usuario_interesado == current_user.id,
            PropuestaIntercambio.aceptada == True
        ).first()
        if not propuesta:
            raise HTTPException(status_code=403, detail="No autorizado")

    intercambio.estado = EstadoIntercambioEnum.Finalizado
    db.commit()
    return {"message": "Intercambio finalizado"}