from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship

class Habilidad(Base):
    __tablename__ = "habilidades"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(255))
    descripcion = Column(Text)
    categoria = Column(String(255))

    curso_habilidades = relationship("CursoHabilidad", back_populates="habilidad")