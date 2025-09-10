from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .user_schema import UserResponse as UsuarioBase
from .mensaje_schema import Mensaje

class ChatBase(BaseModel):
    tipo: str
    nombre: Optional[str] = None

class ChatCreate(ChatBase):
    pass

class Chat(ChatBase):
    id: int
    fecha_creacion: datetime
    usuarios: List[UsuarioBase] = []
    mensajes: List[Mensaje] = []

    class Config:
        orm_mode = True