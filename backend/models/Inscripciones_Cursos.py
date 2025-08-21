from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
import datetime

class EstadoInscripcion(str, enum.Enum):
    Pendiente = "Pendiente"
    Confirmado = "Confirmado"
    Finalizado = "Finalizado"

class InscripcionCurso(Base):
    __tablename__ = "inscripciones_cursos"
    id = Column(Integer, primary_key=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_inscripcion = Column(DateTime, default= datetime.now)
    estado = Column(Enum(EstadoInscripcion))