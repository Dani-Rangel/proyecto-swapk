from db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from sqlalchemy.orm import relationship

class TipoNotificacion(str, enum.Enum):
    Curso = "Curso"
    Intercambio = "Intercambio"
    Mensaje = "Mensaje"
    Publicacion = "Publicacion"
    comentario = "comentario"


class Notificacion(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"))
    contenido = Column(Text)
    tipo = Column(Enum(TipoNotificacion))
    fecha = Column(DateTime)
    leido = Column(Boolean, default=False)

usuario = relationship("Usuario")    
