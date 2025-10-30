# models/contenido_curso.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime,Enum, func
from sqlalchemy.orm import relationship
from backend.db import Base
import enum


class TipoContenido(str, enum.Enum):
    texto = "texto"
    video = "video"
    archivo = "archivo"
    imagen = "imagen"

class ContenidoCurso(Base):
    __tablename__ = "contenido_curso"

    id = Column(Integer, primary_key=True, index=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    tipo = Column(Enum(TipoContenido), nullable=False)  # 'texto', 'video', 'archivo'
    contenido = Column(Text, nullable=False)   # texto, URL de video o URL de archivo
    orden = Column(Integer, default=0, nullable=False)
    nivel = Column(Integer, default=1)  # 1 = módulo, 2 = lección
    parent_id = Column(Integer, ForeignKey("contenido_curso.id"), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con Curso
    curso = relationship("Curso", back_populates="contenido")
    parent = relationship("ContenidoCurso", remote_side=[id], back_populates="children")
    children = relationship("ContenidoCurso", back_populates="parent", cascade="all, delete-orphan")
    bloques = relationship("BloqueContenido", back_populates="leccion", cascade="all, delete-orphan")