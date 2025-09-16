from pydantic import BaseModel, EmailStr
from typing import Optional

class UserResponse(BaseModel):
    """
    Esquema para devolver información pública del usuario + perfil.
    Usado en login, chats, perfiles, etc.
    """
    id: int
    nombre: str
    email: EmailStr

    # Datos del perfil
    descripcion: Optional[str] = None
    ubicacion: Optional[str] = None
    telefono: Optional[str] = None
    foto_perfil: Optional[str] = None
    sitio_web: Optional[str] = None
    fecha_nacimiento: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True
        fields = {"email": "correo"}


class UserUpdate(BaseModel):
    """
    Esquema para actualizar datos del usuario (nombre y correo).
    No incluye contraseña ni rol.
    """
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        orm_mode = True
        from_attributes = True
        fields = {"email": "correo"}

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class PasswordConfirm(BaseModel):
    password: str


class UserProfileUpdate(BaseModel):
    """
    Esquema para actualizar solo el perfil.
    """
    descripcion: Optional[str] = None
    ubicacion: Optional[str] = None
    telefono: Optional[str] = None
    sitio_web: Optional[str] = None
    fecha_nacimiento: Optional[str] = None  # formato ISO

    class Config:
        orm_mode = True
        from_attributes = True
        
# Creamos nueva schema para chat

class UserForChatResponse(BaseModel):
    id: str  # ✅ Cambiado a str
    name: str
    username: str
    avatar: str

    class Config:
        orm_mode = True
        from_attributes = True
        fields = {
            "name": "nombre",
            "username": "email",
        }