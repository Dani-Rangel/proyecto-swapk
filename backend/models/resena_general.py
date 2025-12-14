# backend/models/resena_general.py
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db import Base
from .usuarios import Usuario

class ResenaGeneral(Base):
    __tablename__ = "resena_general"

    id = Column(Integer, primary_key=True, index=True)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    calificacion = Column(Float, nullable=False)
    comentario = Column(Text, nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con el usuario autor
    autor = relationship("Usuario", backref="reseñas_generales")
