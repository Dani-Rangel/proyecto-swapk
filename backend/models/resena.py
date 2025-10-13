from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Float
from datetime import datetime
from sqlalchemy.orm import relationship


class Resena(Base):
    __tablename__ = "resena"
    id = Column(Integer, primary_key=True)
    intercambio_id = Column(Integer, ForeignKey("intercambios.id"))
    destinatario_id = Column(Integer, ForeignKey("usuarios.id"))  # antes era usuario_id
    autor_id = Column(Integer, ForeignKey("usuarios.id"))         # nuevo campo
    calificacion = Column(Float)
    comentario = Column(Text)
    fecha = Column(DateTime, default=datetime.now)
    ciclo = Column(Integer, default=1) 

    destinatario = relationship("Usuario", foreign_keys=[destinatario_id])
    autor = relationship("Usuario", foreign_keys=[autor_id])
    intercambio = relationship("Intercambio", back_populates="reseñas")

    