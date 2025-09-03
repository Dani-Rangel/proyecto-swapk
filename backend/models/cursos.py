from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
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

    usuario = relationship('Usuario', back_populates='cursos')
    attachments = relationship("Attachment", back_populates="curso")
    curso_habilidades = relationship("CursoHabilidad", back_populates="curso")
