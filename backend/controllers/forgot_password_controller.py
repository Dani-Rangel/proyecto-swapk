from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from backend.schemas.forgot_password_schema import ForgotPasswordRequest, ResetPasswordRequest, PasswordResetOut
from pydantic import BaseModel, EmailStr
import asyncio
from email.mime.text import MIMEText
import aiosmtplib
import random
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.usuarios import Usuario
from passlib.hash import argon2  

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Diccionarios temporales
reset_codes = {}   # email -> código de 6 dígitos
reset_tokens = {}  # email -> token de reset (string largo)

# Función para hashear contraseñas con Argon2
def hash_password(password: str) -> str:
    return argon2.hash(password)

# Función para enviar correo de forma asíncrona
async def send_password_reset_email(to_email: str, code: str):
    message = MIMEText(
        f"""
        ¡Hola!

        Hemos recibido una solicitud para restablecer tu contraseña en Swapk. 
        Para continuar, utiliza el siguiente código de verificación:

        🔐 Código de seguridad: {code}

        Si no fuiste tú quien solicitó el cambio, puedes ignorar este mensaje y tu cuenta seguirá segura.

        Recuerda que este código es válido solo por un tiempo limitado, así que úsalo lo antes posible.

        ¡Estamos aquí para ayudarte en lo que necesites! 💙

        El equipo de soporte de Swapk
        """
    )
    message["From"] = "swapk.soporte@gmail.com"
    message["To"] = to_email
    message["Subject"] = "🔑 Restablece tu contraseña en Swapk"

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username="swapk.soporte@gmail.com",
        password="lcju uztt nfao onad",  # contraseña de app
    )

# Endpoint para enviar código
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        # Generar código de 6 dígitos
        code = f"{random.randint(0, 999999):06}"
        reset_codes[request.email] = code

        # Generar token largo para el reset real
        token = f"{random.getrandbits(128):032x}"
        reset_tokens[request.email] = token

        # Enviar correo sin bloquear
        asyncio.create_task(send_password_reset_email(request.email, code))

        return JSONResponse(
            status_code=200,
            content={"message": "Correo de recuperación enviado"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Modelo para verificar código
class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

# Endpoint para verificar código
@router.post("/verify-code")
async def verify_code(request: VerifyCodeRequest):
    if request.email not in reset_codes:
        raise HTTPException(status_code=404, detail="No se encontró código para este email")

    if reset_codes[request.email] != request.code:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    # Código correcto, eliminarlo
    del reset_codes[request.email]

    # Devuelve token para usar en reset-password
    token = reset_tokens[request.email]

    return JSONResponse(
        status_code=200,
        content={"message": "Código verificado correctamente", "token": token}
    )

# Endpoint para cambiar contraseña
@router.post("/reset-password", response_model=PasswordResetOut)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Validar token
    email = next((k for k, v in reset_tokens.items() if v == request.token), None)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    # Buscar usuario en DB
    user = db.query(Usuario).filter(Usuario.correo == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar contraseña hasheada con Argon2
    user.contrasena_hash = hash_password(request.new_password)
    db.commit()

    # Eliminar token usado
    del reset_tokens[email]

    return PasswordResetOut(message="Contraseña actualizada exitosamente")
