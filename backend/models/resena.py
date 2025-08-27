from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Float
from datetime import datetime


class Resena(Base):
    __tablename__ = "resena"
    id = Column(Integer, primary_key=True)
    intercambio_id = Column(Integer, ForeignKey("intercambios.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    calificacion = Column(Float)
    comentario = Column(Text)
    fecha = Column(DateTime, default= datetime.now)

    