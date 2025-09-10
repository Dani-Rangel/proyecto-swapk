from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from .user_schema import UserResponse
import re

class RegisterRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=255)
    correo: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe tener al menos una letra minúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial")
        return v


class LoginRequest(BaseModel):
    emailOrUsername: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La nueva contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La nueva contraseña debe tener al menos una letra mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La nueva contraseña debe tener al menos una letra minúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("La nueva contraseña debe tener al menos un número")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("La nueva contraseña debe tener al menos un carácter especial")
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Respuesta completa de login (opcional, recomendado)
class LoginResponse(BaseModel):
    token: Token
    user: "UserResponse"