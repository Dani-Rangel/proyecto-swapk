from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from datetime import datetime


class Mensaje(Base):
    __tablename__ = "mensajes"
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chat.id"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id"))
    mensaje = Column(Text)
    fecha = Column(DateTime, default= datetime.now)
    leido = Column(Boolean, default=False)