# models/propuesta.py
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime

class PropuestaIntercambio(Base):
    __tablename__ = "propuestas_intercambio"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_intercambio = Column(Integer, ForeignKey("intercambios.id"), nullable=False)
    id_usuario_interesado = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    aceptada = Column(Boolean, default=False)  # False = pendiente, True = confirmada
    fecha_propuesta = Column(DateTime, default=datetime.utcnow)

    intercambio = relationship("Intercambio", back_populates="propuestas")
    usuario_interesado = relationship("Usuario", foreign_keys=[id_usuario_interesado])
