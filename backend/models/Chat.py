from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from datetime import datetime


class Chat(Base):
    __tablename__ = "chat"
    id = Column(Integer, primary_key=True)
    usuario1_id = Column(Integer, ForeignKey("usuarios.id"))
    usuario2_id = Column(Integer, ForeignKey("usuarios.id"))
    Fecha_Creacion = Column(DateTime, default= datetime.now)