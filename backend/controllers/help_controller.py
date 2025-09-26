# backend/controllers/help_controller.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

router = APIRouter(prefix="/help", tags=["Help"])

# Configuración del correo
conf = ConnectionConfig(
    MAIL_USERNAME="swapk.soporte@gmail.com",
    MAIL_PASSWORD="pyaa ihkw byse cacr",  # Tu app password de Gmail
    MAIL_SERVER="smtp.gmail.com",
    MAIL_PORT=587,
    MAIL_FROM="swapk.soporte@gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

# Opciones de tipo de mensaje
TIPOS_MENSAJE = ["Bug", "Sugerencia", "Soporte", "Otro"]

class HelpRequest(BaseModel):
    nombre: str
    email: EmailStr
    tipo: str  # Debe ser uno de TIPOS_MENSAJE
    mensaje: str

@router.post("/send")
async def send_help_email(request: HelpRequest):
    # Validar que el tipo sea uno de los permitidos
    if request.tipo not in TIPOS_MENSAJE:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido. Opciones válidas: {', '.join(TIPOS_MENSAJE)}"
        )

    # Contenido para el administrador
    admin_body = f"""
    <html>
        <body>
            <h2>Nuevo mensaje recibido</h2>
            <p><strong>Nombre del usuario:</strong> {request.nombre}</p>
            <p><strong>Correo del usuario:</strong> {request.email}</p>
            <p><strong>Motivo:</strong> {request.tipo}</p>
            <hr>
            <p><strong>Mensaje:</strong></p>
            <p>{request.mensaje}</p>
        </body>
    </html>
    """

    # Contenido para el usuario (confirmación)
    user_body = f"""
    <html>
        <body>
            <h2>Hola {request.nombre},</h2>
            <p>Hemos recibido tu mensaje con el motivo de <strong>{request.tipo}</strong>.</p>
            <p>Nos pondremos en contacto contigo lo antes posible.</p>
            <hr>
            <p>Atentamente,</p>
            <p><strong>Equipo de Soporte de Swapk</strong></p>
        </body>
    </html>
    """

    try:
        fm = FastMail(conf)

        # Mensaje para el administrador
        admin_message = MessageSchema(
            subject=f"[{request.tipo}] Nuevo mensaje de {request.nombre}",
            recipients=["swapk.soporte@gmail.com"],
            body=admin_body,
            subtype="html"
        )
        await fm.send_message(admin_message)

        # Mensaje de confirmación al usuario
        user_message = MessageSchema(
            subject="Hemos recibido tu mensaje",
            recipients=[request.email],
            body=user_body,
            subtype="html"
        )
        await fm.send_message(user_message)

        return {"msg": "Mensaje enviado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))