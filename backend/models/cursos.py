from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum, func
from sqlalchemy.orm import relationship
import enum

class Curso(Base):
    __tablename__ = "cursos"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255))
    descripcion = Column(Text)
    objetivo = Column(String(255))
    User_Id = Column(Integer, ForeignKey("usuarios.id"))
    img_Cursos = Column(String(255), nullable= True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship('Usuario', back_populates='cursos')
    attachments = relationship("Attachment", back_populates="curso")
    curso_habilidades = relationship("CursoHabilidad", back_populates="curso")
    inscripciones = relationship("InscripcionCurso", back_populates="curso")
    contenido = relationship("ContenidoCurso", back_populates="curso", cascade="all, delete-orphan")
    
