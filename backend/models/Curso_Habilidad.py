from db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

class CursoHabilidad(Base):
    __tablename__ = "curso_habilidad"
    id = Column(Integer, primary_key=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    habilidad_id = Column(Integer, ForeignKey("habilidad.id"))

    curso = relationship("Curso", back_populates="curso_habilidades")
    habilidad = relationship("Habilidad", back_populates="curso_habilidades")
