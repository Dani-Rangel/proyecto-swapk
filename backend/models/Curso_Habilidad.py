from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum

class CursoHabilidad(Base):
    __tablename__ = "curso_habilidad"
    id = Column(Integer, primary_key=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    habilidad_id = Column(Integer, ForeignKey("habilidad.id"))
    tipo = Column(String(255))