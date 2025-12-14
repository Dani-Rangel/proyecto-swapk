from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import jwt
from datetime import datetime, timedelta

from db.database import get_db
from models.usuarios import Usuario, RolUsuario
from models.perfil import Perfil
from schemas.google_auth_schema import TokenSchema
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

router = APIRouter()

CLIENT_ID = "315082668508-pbvop5628cd5bsna1cbk7e4quhvhjs31.apps.googleusercontent.com"


@router.post("/login")
def google_login(data: TokenSchema, db: Session = Depends(get_db)):
    token = data.token
    try:
        # Verificar token con Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        email = idinfo["email"]
        nombre = idinfo.get("name", "Usuario Google")

        usuario = db.query(Usuario).filter(Usuario.correo == email).first()

        if not usuario:
            # Crear usuario
            usuario = Usuario(
                nombre=nombre,
                correo=email,
                contrasena_hash="google_dummy",  # contraseña dummy
                rol=RolUsuario.Usuario
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

            # Crear perfil asociado
            perfil = Perfil(
                id_usuario=usuario.id,
                descripcion="",
                ubicacion="",
                Tel=None,
                foto_perfil=None
            )
            db.add(perfil)
            db.commit()
            db.refresh(perfil)
        else:
            perfil = usuario.perfil

        # Generar JWT
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        token_data = {"sub": str(usuario.id), "exp": expire}
        jwt_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        # Retornar en el mismo formato que login normal
        return {
            "message": "Login con Google exitoso",
            "token": jwt_token,
            "user": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "rol": usuario.rol.value
            },
            "perfil": {
                "id": perfil.id,
                "id_usuario": perfil.id_usuario,
                "nombre": usuario.nombre,
                "correo": usuario.correo
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
