from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from datetime import datetime


class tipoLlamada(str, enum.Enum):
    Audio = "Audio"
    Video = "Video"

class EstadoLlamada(str, enum.Enum):
    En_Curso = "En Curso"
    Finalizada = "Finalizada"
    Cancelada = "Cancelada"


class Llamada(Base):
    __tablename__ = "llamadas"
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo =  Column(Enum(tipoLlamada))
    Estado = Column(Enum(EstadoLlamada))
    fecha_inicio = Column(DateTime, default= datetime.now)
    fecha_fin = Column(DateTime)
    duracion = Column(Integer)